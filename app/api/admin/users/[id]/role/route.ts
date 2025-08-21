import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

export const POST = withApiLogging(async (request: Request) => {
    try {
        const ctx = await getAuthContext(request);
        if (ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'users');
        const userId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(userId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const body = await request.json() as { role: 'student' | 'teacher' | 'admin' };
        if (!body?.role) return NextResponse.json({ success: false, error: '缺少角色' }, { status: 400 });

        await ctx.env.DB.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role').bind(userId, body.role).run();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('设置用户角色错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
});




