import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

export const PATCH = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const body = await request.json() as { display_name?: string; avatar_url?: string; grade_level?: string | null };

    await ctx.env.DB
        .prepare('UPDATE users SET display_name = COALESCE(?, display_name), avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(body.display_name ?? null, body.avatar_url ?? null, ctx.userId)
        .run();

    if (body.grade_level !== undefined) {
        await ctx.env.DB
            .prepare('INSERT INTO user_profile (user_id, plan, grade_level) VALUES (?, COALESCE((SELECT plan FROM user_profile WHERE user_id = ?), "free"), ?) ON CONFLICT(user_id) DO UPDATE SET grade_level = excluded.grade_level')
            .bind(ctx.userId, ctx.userId, body.grade_level)
            .run();
    }

    return NextResponse.json({ success: true });
});


