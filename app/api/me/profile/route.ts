import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function PATCH(request: Request) {
    const ctx = await getAuthContext(request);
    const body = await request.json() as { display_name?: string; avatar_url?: string };

    await ctx.env.DB
        .prepare('UPDATE users SET display_name = COALESCE(?, display_name), avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(body.display_name ?? null, body.avatar_url ?? null, ctx.userId)
        .run();

    return NextResponse.json({ success: true });
}


