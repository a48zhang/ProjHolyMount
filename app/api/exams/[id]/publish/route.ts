import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

export const POST = withApiLogging(async (request: Request) => {
    try {
        const ctx = await getAuthContext(request);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'exams');
        const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const body = await request.json();
        const { start_at, end_at } = body as { start_at: string; end_at: string };
        if (!start_at || !end_at) return NextResponse.json({ success: false, error: '缺少时间窗口' }, { status: 400 });

        const own = await ctx.env.DB
            .prepare('SELECT author_id, status FROM exams WHERE id = ?')
            .bind(id)
            .first<{ author_id: number; status: string }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        if (own.status !== 'draft') return NextResponse.json({ success: false, error: '仅草稿可发布' }, { status: 400 });

        await ctx.env.DB
            .prepare(`UPDATE exams SET status='published', start_at=?, end_at=?, updated_at=datetime('now') WHERE id = ?`)
            .bind(start_at, end_at, id)
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('发布试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
});

