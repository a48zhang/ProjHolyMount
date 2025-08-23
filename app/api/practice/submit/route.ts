import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

type QuestionRow = {
    id: number;
    type: string;
    schema_version: number;
    answer_key_json: string | null;
};

function scoreObjective(question: QuestionRow, answer: any): number {
    try {
        const key = question.answer_key_json ? JSON.parse(question.answer_key_json) : null;
        if (!key) return 0;

        if (question.type === 'single_choice') {
            return String(answer) === String(key) ? 1 : 0;
        }
        if (question.type === 'multiple_choice') {
            const a = Array.isArray(answer) ? [...answer].sort() : [];
            const b = Array.isArray(key) ? [...key].sort() : [];
            return JSON.stringify(a) === JSON.stringify(b) ? 1 : 0;
        }
        if (question.type === 'fill_blank') {
            const blanks: string[] = Array.isArray(answer) ? answer : [];
            const keys: any[] = Array.isArray(key) ? key : [];
            if (blanks.length !== keys.length) return 0;
            for (let i = 0; i < keys.length; i++) {
                const accept = Array.isArray(keys[i]) ? keys[i] : [keys[i]];
                const got = String((blanks[i] ?? '')).trim().toLowerCase();
                const ok = accept.some((v: any) => String(v).trim().toLowerCase() === got);
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

export async function POST(request: Request) {
    try {
        const ctx = await getAuthContext(request); // 仅校验登录并获取 env
        const body = (await request.json()) as {
            items: Array<{ question_id: number; answer: any }>;
        };
        const list = Array.isArray(body?.items) ? body.items : [];
        if (list.length === 0) return NextResponse.json({ success: false, error: '缺少作答' }, { status: 400 });

        // 查询题目的 answer_key
        // 动态 IN 占位
        const ids = list.map(it => Number(it.question_id)).filter(n => Number.isFinite(n));
        if (ids.length === 0) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const placeholders = ids.map(() => '?').join(',');

        const rows = await ctx.env.DB
            .prepare(`SELECT id, type, schema_version, answer_key_json FROM questions WHERE id IN (${placeholders})`)
            .bind(...ids)
            .all<QuestionRow>();

        const map = new Map<number, QuestionRow>();
        for (const r of rows.results || []) map.set(r.id, r);

        const results = list.map(it => {
            const q = map.get(it.question_id);
            if (!q) return { question_id: it.question_id, correct: false, score_unit: 0, answer_key: null };
            const unit = scoreObjective(q, it.answer);
            return { question_id: it.question_id, correct: unit === 1, score_unit: unit, answer_key: q.answer_key_json ? JSON.parse(q.answer_key_json) : null };
        });

        const correctCount = results.filter(r => r.correct).length;

        return NextResponse.json({ success: true, data: { results, correct_count: correctCount, total: results.length } });
    } catch (error) {
        console.error('练习交卷失败:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}


