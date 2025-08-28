import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

export async function assignExamWithContext(
    ctx: AuthContext,
    id: number,
    user_ids: number[],
    due_at: string | null
) {
    try {
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const own = await ctx.env.DB
            .prepare('SELECT author_id, status FROM exams WHERE id = ?')
            .bind(id)
            .first<{ author_id: number; status: string }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        if (own.status !== 'published') return NextResponse.json({ success: false, error: '仅发布后可分配' }, { status: 400 });

        if (!Array.isArray(user_ids) || user_ids.length === 0) return NextResponse.json({ success: false, error: '缺少学生列表' }, { status: 400 });

        let successCount = 0;
        for (const uid of user_ids) {
            try {
                await ctx.env.DB
                    .prepare(`INSERT INTO exam_assignments (exam_id, user_id, assigned_at, due_at) VALUES (?, ?, datetime('now'), ?)`)
                    .bind(id, uid, due_at)
                    .run();
                successCount += 1;
            } catch (e) {
                // 唯一约束冲突忽略
            }
        }
        return NextResponse.json({ success: true, data: { assigned: successCount } });
    } catch (error) {
        console.error('分配试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = await request.json();
    const { user_ids = [], due_at = null } = body as { user_ids: number[]; due_at?: string | null };
    return assignExamWithContext(ctx, id, user_ids, due_at);
});

