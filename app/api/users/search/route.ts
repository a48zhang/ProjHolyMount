import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

export const GET = withApiLogging(async (request: Request) => {
  try {
    const ctx = await getAuthContext(request);
    if (ctx.role === 'student') return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });

    const url = new URL(request.url);
    const role = (url.searchParams.get('role') || 'student').toLowerCase();
    const query = (url.searchParams.get('query') || '').trim();
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    const like = `%${query}%`;
    let sql = `
      SELECT u.id, u.username, u.email, u.display_name,
             r.role as role,
             p.plan as plan, p.grade_level as grade_level, p.plan_expires_at as plan_expires_at
      FROM users u
      LEFT JOIN user_roles r ON r.user_id = u.id
      LEFT JOIN user_profile p ON p.user_id = u.id
      WHERE ( ? = '' OR u.username LIKE ? OR u.email LIKE ? )`;
    const binds: any[] = [query, like, like];
    if (role !== 'all') {
      sql += ` AND (r.role IS NULL OR r.role = ?)`;
      binds.push(role);
    }
    sql += ` ORDER BY u.id DESC LIMIT ? OFFSET ?`;
    binds.push(limit, offset);

    const rows = await ctx.env.DB.prepare(sql).bind(...binds).all<any>();
    return NextResponse.json({ success: true, data: { users: rows.results || [] } });
  } catch (error) {
    console.error('搜索用户错误:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
});




