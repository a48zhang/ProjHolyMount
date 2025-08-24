import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

async function setExamQuestionsWithContext(
    ctx: AuthContext,
    examId: number,
    items: Array<{ question_id: number; order_index: number; points: number }>
) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const own = await ctx.env.DB
            .prepare('SELECT author_id, status FROM exams WHERE id = ?')
            .bind(examId)
            .first<{ author_id: number; status: string }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        if (own.status !== 'draft') return NextResponse.json({ success: false, error: '仅草稿可编辑题目' }, { status: 400 });

        if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ success: false, error: '缺少题目列表' }, { status: 400 });

        // 清空现有关联
        await ctx.env.DB.prepare('DELETE FROM exam_questions WHERE exam_id = ?').bind(examId).run();

        // 批量插入
        let totalPoints = 0;
        for (const it of items) {
            totalPoints += (it.points || 0);
            await ctx.env.DB
                .prepare('INSERT INTO exam_questions (exam_id, question_id, order_index, points) VALUES (?, ?, ?, ?)')
                .bind(examId, it.question_id, it.order_index, it.points)
                .run();
        }
        await ctx.env.DB.prepare('UPDATE exams SET total_points = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(totalPoints, examId).run();

        return NextResponse.json({ success: true, data: { total_points: totalPoints } });
    } catch (error) {
        console.error('批量设置试卷题目错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = await request.json();
    const { items } = body as { items: Array<{ question_id: number; order_index: number; points: number }> };
    return setExamQuestionsWithContext(ctx, examId, items);
});

