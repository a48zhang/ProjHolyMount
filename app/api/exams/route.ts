import { NextResponse } from 'next/server';
import { getAuthContext, requireRole } from '@/lib/auth';

// 创建试卷（草稿）
export async function POST(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        requireRole(ctx, ['teacher', 'admin']);

        const body = await request.json();
        const { title, description, duration_minutes, randomize = 0, required_plan = null, required_grade_level = null } = body as any;
        if (!title) return NextResponse.json({ success: false, error: '缺少标题' }, { status: 400 });

        await ctx.env.DB
            .prepare(
                `INSERT INTO exams (title, description, author_id, total_points, status, start_at, end_at, duration_minutes, randomize, required_plan, required_grade_level, created_at, updated_at)
         VALUES (?, ?, ?, 0, 'draft', NULL, NULL, ?, ?, ?, ?, datetime('now'), datetime('now'))`
            )
            .bind(title, description || null, ctx.userId, duration_minutes || null, randomize ? 1 : 0, required_plan, required_grade_level)
            .run();
        const created = await ctx.env.DB.prepare('SELECT id FROM exams WHERE author_id = ? ORDER BY id DESC LIMIT 1').bind(ctx.userId).first<{ id: number }>();
        return NextResponse.json({ success: true, data: { id: created?.id } });
    } catch (error) {
        console.error('创建试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 列表试卷
export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
        const list = searchParams.get('list'); // 'public' 返回公开试卷

        let sql: string;
        let binds: any[] = [];
        if (list === 'public') {
            sql = `SELECT id, title, status, start_at, end_at, duration_minutes, randomize, total_points, created_at, updated_at
             FROM exams
             WHERE status = 'published' AND is_public = 1
             ORDER BY id DESC LIMIT ? OFFSET ?`;
            binds = [limit, offset];
        } else if (ctx.role === 'teacher' || ctx.role === 'admin') {
            // 教师看到自己创建的
            sql = `SELECT id, title, status, start_at, end_at, duration_minutes, randomize, total_points, created_at, updated_at FROM exams WHERE author_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`;
            binds = [ctx.userId, limit, offset];
        } else {
            // 学生看到被分配且在窗口内的
            sql = `SELECT e.id, e.title, e.status, e.start_at, e.end_at, e.duration_minutes, e.randomize, e.total_points, e.created_at, e.updated_at
             FROM exams e
             JOIN exam_assignments a ON a.exam_id = e.id AND a.user_id = ?
             ORDER BY e.id DESC LIMIT ? OFFSET ?`;
            binds = [ctx.userId, limit, offset];
        }

        const rows = await ctx.env.DB.prepare(sql).bind(...binds).all<any>();
        return NextResponse.json({ success: true, data: rows.results || [] });
    } catch (error) {
        console.error('获取试卷列表错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

