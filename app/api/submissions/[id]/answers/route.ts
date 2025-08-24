import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

async function saveAnswersWithContext(ctx: AuthContext, submissionId: number, items: Array<{ exam_question_id: number; answer_json: unknown }>) {
    try {
        if (!Number.isFinite(submissionId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const sub = await ctx.env.DB
            .prepare('SELECT exam_id, user_id, status FROM submissions WHERE id = ?')
            .bind(submissionId)
            .first<{ exam_id: number; user_id: number; status: string }>();
        if (!sub) return NextResponse.json({ success: false, error: '提交不存在' }, { status: 404 });
        if (sub.user_id !== ctx.userId) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        if (sub.status !== 'in_progress') return NextResponse.json({ success: false, error: '提交已结束，不可修改' }, { status: 400 });

        if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ success: false, error: '缺少答案列表' }, { status: 400 });

        for (const it of items) {
            await ctx.env.DB
                .prepare(
                    `INSERT INTO submission_answers (submission_id, exam_question_id, answer_json, score, is_auto_scored)
           VALUES (?, ?, ?, 0, 0)
           ON CONFLICT(submission_id, exam_question_id) DO UPDATE SET answer_json=excluded.answer_json`
                )
                .bind(submissionId, it.exam_question_id, JSON.stringify(it.answer_json ?? null))
                .run();
        }

        return NextResponse.json({ success: true, data: { saved: items.length } });
    } catch (error) {
        console.error('保存答案错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const PUT = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'submissions');
    const submissionId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = await request.json();
    const { items } = body as { items: Array<{ exam_question_id: number; answer_json: unknown }> };
    return saveAnswersWithContext(ctx, submissionId, items);
});

