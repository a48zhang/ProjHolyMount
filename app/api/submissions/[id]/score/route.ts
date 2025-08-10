import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'submissions');
        const submissionId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(submissionId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const sub = await ctx.env.DB
            .prepare('SELECT s.exam_id, s.user_id, s.status, e.author_id FROM submissions s JOIN exams e ON e.id = s.exam_id WHERE s.id = ?')
            .bind(submissionId)
            .first<{ exam_id: number; user_id: number; status: string; author_id: number }>();
        if (!sub) return NextResponse.json({ success: false, error: '提交不存在' }, { status: 404 });
        if (sub.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权评分' }, { status: 403 });

        const body = await request.json();
        const { items = [], feedback = null } = body as { items: Array<{ exam_question_id: number; score: number }>; feedback?: string | null };

        let manual = 0;
        for (const it of items) {
            manual += it.score || 0;
            await ctx.env.DB
                .prepare('UPDATE submission_answers SET score = ?, is_auto_scored = 0 WHERE submission_id = ? AND exam_question_id = ?')
                .bind(it.score || 0, submissionId, it.exam_question_id)
                .run();
        }

        // 重新汇总：手工分以传入累加，自动分从 submissions.score_auto 读取
        const current = await ctx.env.DB
            .prepare('SELECT score_auto FROM submissions WHERE id = ?')
            .bind(submissionId)
            .first<{ score_auto: number }>();
        const total = (current?.score_auto || 0) + manual;

        await ctx.env.DB
            .prepare("UPDATE submissions SET status='graded', score_manual=?, score_total=?, feedback=?, updated_at=datetime('now') WHERE id = ?")
            .bind(manual, total, feedback, submissionId)
            .run();

        return NextResponse.json({ success: true, data: { score_manual: manual, score_total: total } });
    } catch (error) {
        console.error('人工评分错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

