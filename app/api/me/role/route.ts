import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

type Role = 'student' | 'teacher' | 'admin';

export const PATCH = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const body = (await request.json()) as { role?: Role };
    const role = body.role;
    if (!role || !['student', 'teacher', 'admin'].includes(role)) {
        return NextResponse.json({ success: false, error: '无效角色' }, { status: 400 });
    }
    const rank: Record<Role, number> = { student: 1, teacher: 2, admin: 3 };
    // 禁止越权升级：只能保持或降级
    if (rank[role] > rank[ctx.role]) {
        return NextResponse.json({ success: false, error: '无权升级角色' }, { status: 403 });
    }
    await ctx.env.DB
        .prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role')
        .bind(ctx.userId, role)
        .run();
    return NextResponse.json({ success: true });
});


