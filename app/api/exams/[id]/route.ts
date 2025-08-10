import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

// 获取试卷详情
export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'exams');
        const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        // 教师可看自己创建的；学生仅可看被分配的
        let row: any | null = null;
        if (ctx.role === 'teacher' || ctx.role === 'admin') {
            row = await ctx.env.DB.prepare('SELECT * FROM exams WHERE id = ? AND author_id = ?').bind(id, ctx.userId).first<any>();
        }
        if (!row && ctx.role === 'student') {
            row = await ctx.env.DB
                .prepare('SELECT e.* FROM exams e JOIN exam_assignments a ON a.exam_id = e.id AND a.user_id = ? WHERE e.id = ?')
                .bind(ctx.userId, id)
                .first<any>();
        }
        if (!row) return NextResponse.json({ success: false, error: '无权访问或不存在' }, { status: 404 });

        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        console.error('获取试卷详情错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 更新试卷（草稿阶段）
export async function PATCH(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'exams');
        const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        // 仅作者可改
        const own = await ctx.env.DB.prepare('SELECT author_id, status FROM exams WHERE id = ?').bind(id).first<{ author_id: number; status: string }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        if (own.status !== 'draft') return NextResponse.json({ success: false, error: '非草稿不可修改' }, { status: 400 });

        const body = await request.json();
        const { title, description, duration_minutes, randomize, required_plan, required_grade_level, is_public } = body as any;

        await ctx.env.DB
            .prepare(
                `UPDATE exams SET
           title = COALESCE(?, title),
           description = COALESCE(?, description),
           duration_minutes = COALESCE(?, duration_minutes),
           randomize = COALESCE(?, randomize),
           is_public = COALESCE(?, is_public),
           required_plan = COALESCE(?, required_plan),
           required_grade_level = COALESCE(?, required_grade_level),
           updated_at = datetime('now')
         WHERE id = ?`
            )
            .bind(
                title ?? null,
                description ?? null,
                typeof duration_minutes === 'number' ? duration_minutes : null,
                typeof randomize === 'boolean' ? (randomize ? 1 : 0) : null,
                typeof is_public === 'boolean' ? (is_public ? 1 : 0) : null,
                required_plan ?? null,
                required_grade_level ?? null,
                id
            )
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('更新试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

