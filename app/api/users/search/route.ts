import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        if (ctx.role === 'student') return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });

        const url = new URL(request.url);
        const role = url.searchParams.get('role') || 'student';
        const query = (url.searchParams.get('query') || '').trim();
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

        const sql = `
      SELECT u.id, u.username, u.email, u.display_name
      FROM users u
      LEFT JOIN user_roles r ON r.user_id = u.id
      WHERE (? = '' OR u.username LIKE ? OR u.email LIKE ?)
        AND (r.role IS NULL OR r.role = ?)
      ORDER BY u.id DESC
      LIMIT ? OFFSET ?
    `;
        const like = `%${query}%`;
        const rows = await ctx.env.DB.prepare(sql).bind(query, like, like, role, limit, offset).all<any>();
        return NextResponse.json({ success: true, data: { users: rows.results || [] } });
    } catch (error) {
        console.error('搜索用户错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}




