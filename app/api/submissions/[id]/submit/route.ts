import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

type Question = {
    id: number;
    type: string;
    schema_version: number;
    answer_key_json: string | null;
};

function scoreObjective(question: Question, answer: unknown): number {
    try {
        const type = question.type;
        const key = question.answer_key_json ? JSON.parse(question.answer_key_json) : null;
        if (!key) return 0;

        if (type === 'single_choice') {
            return String(answer) === String(key) ? 1 : 0;
        }
        if (type === 'multiple_choice') {
            const a = Array.isArray(answer) ? [...answer].sort() : [];
            const b = Array.isArray(key) ? [...key].sort() : [];
            return JSON.stringify(a) === JSON.stringify(b) ? 1 : 0;
        }
        if (type === 'fill_blank') {
            const blanks: string[] = Array.isArray(answer) ? answer : [];
            const keys: unknown[] = Array.isArray(key) ? key : [];
            if (blanks.length !== keys.length) return 0;
            for (let i = 0; i < keys.length; i++) {
                const accept = Array.isArray(keys[i]) ? keys[i] as string[] : [keys[i]];
                const got = String((blanks[i] ?? '')).trim().toLowerCase();
                const ok = accept.some((v: unknown) => String(v).trim().toLowerCase() === got);
                if (!ok) return 0;
            }
            return 1;
        }
        // 主观题不自动判分
        return 0;
    } catch {
        return 0;
    }
}

export async function submitWithContext(ctx: AuthContext, submissionId: number) {
    try {
        if (!Number.isFinite(submissionId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const sub = await ctx.env.DB
            .prepare('SELECT exam_id, user_id, status FROM submissions WHERE id = ?')
            .bind(submissionId)
            .first<{ exam_id: number; user_id: number; status: string }>();
        if (!sub) return NextResponse.json({ success: false, error: '提交不存在' }, { status: 404 });
        if (sub.user_id !== ctx.userId) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        if (sub.status !== 'in_progress') return NextResponse.json({ success: false, error: '不可重复提交' }, { status: 400 });

        // 拉取试卷题目与分值
        const eqs = await ctx.env.DB
            .prepare('SELECT eq.id as exam_question_id, q.id as question_id, q.type, q.schema_version, q.answer_key_json, eq.points FROM exam_questions eq JOIN questions q ON q.id = eq.question_id WHERE eq.exam_id = ? ORDER BY eq.order_index ASC')
            .bind(sub.exam_id)
            .all<{ exam_question_id: number; question_id: number; type: string; schema_version: number; answer_key_json: string | null; points: number }>();

        const answers = await ctx.env.DB
            .prepare('SELECT exam_question_id, answer_json FROM submission_answers WHERE submission_id = ?')
            .bind(submissionId)
            .all<{ exam_question_id: number; answer_json: string }>();

        const answerMap = new Map<number, unknown>();
        for (const r of answers.results || []) {
            answerMap.set(r.exam_question_id, r.answer_json ? JSON.parse(r.answer_json) : null);
        }

        let autoScore = 0;
        for (const row of eqs.results || []) {
            const ans = answerMap.get(row.exam_question_id);
            const unit = scoreObjective({ id: row.question_id, type: row.type, schema_version: row.schema_version, answer_key_json: row.answer_key_json }, ans);
            const got = unit === 1 ? row.points : 0;
            autoScore += got;
            await ctx.env.DB
                .prepare('UPDATE submission_answers SET score = ?, is_auto_scored = 1 WHERE submission_id = ? AND exam_question_id = ?')
                .bind(got, submissionId, row.exam_question_id)
                .run();
        }

        await ctx.env.DB
            .prepare("UPDATE submissions SET status='submitted', submitted_at=datetime('now'), score_auto=?, score_total=score_manual + ?, updated_at=datetime('now') WHERE id = ?")
            .bind(autoScore, autoScore, submissionId)
            .run();

        return NextResponse.json({ success: true, data: { score_auto: autoScore } });
    } catch (error) {
        console.error('交卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'submissions');
    const submissionId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    return submitWithContext(ctx, submissionId);
});

