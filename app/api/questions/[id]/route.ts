import { NextResponse } from 'next/server';
import { getAuthContext, requireRole, requireExamAuthor } from '@/lib/auth';

// 获取题目详情（作者或admin）
export async function GET(_request: Request) {
    try {
        const ctx = await getAuthContext(_request);
        requireRole(ctx, ['teacher', 'admin']);

        const pathname = new URL(_request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'questions');
        const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const row = await ctx.env.DB
            .prepare('SELECT * FROM questions WHERE id = ?')
            .bind(id)
            .first<any>();
        if (!row) return NextResponse.json({ success: false, error: '题目不存在' }, { status: 404 });
        if (row.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });

        // 解析 JSON 字段
        row.content_json = row.content_json ? JSON.parse(row.content_json) : null;
        row.answer_key_json = row.answer_key_json ? JSON.parse(row.answer_key_json) : null;
        row.rubric_json = row.rubric_json ? JSON.parse(row.rubric_json) : null;

        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        console.error('获取题目详情错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 更新题目（作者或admin）
export async function PATCH(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        requireRole(ctx, ['teacher', 'admin']);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'questions');
        const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const owned = await ctx.env.DB
            .prepare('SELECT author_id FROM questions WHERE id = ?')
            .bind(id)
            .first<{ author_id: number }>();
        if (!owned) return NextResponse.json({ success: false, error: '题目不存在' }, { status: 404 });
        if (owned.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

        const body = await request.json();
        const { content_json, answer_key_json, rubric_json, is_active } = body as any;

        await ctx.env.DB
            .prepare(
                `UPDATE questions SET 
           content_json = COALESCE(?, content_json),
           answer_key_json = COALESCE(?, answer_key_json),
           rubric_json = COALESCE(?, rubric_json),
           is_active = COALESCE(?, is_active),
           updated_at = datetime('now')
         WHERE id = ?`
            )
            .bind(
                content_json ? JSON.stringify(content_json) : null,
                answer_key_json ? JSON.stringify(answer_key_json) : null,
                rubric_json ? JSON.stringify(rubric_json) : null,
                typeof is_active === 'number' ? is_active : null,
                id
            )
            .run();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('更新题目错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 删除题目（软删：is_active=0）
export async function DELETE(_request: Request) {
    try {
        const ctx = await getAuthContext(_request);
        requireRole(ctx, ['teacher', 'admin']);
        const pathname = new URL(_request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'questions');
        const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const owned = await ctx.env.DB
            .prepare('SELECT author_id FROM questions WHERE id = ?')
            .bind(id)
            .first<{ author_id: number }>();
        if (!owned) return NextResponse.json({ success: false, error: '题目不存在' }, { status: 404 });
        if (owned.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

        await ctx.env.DB
            .prepare('UPDATE questions SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?')
            .bind(id)
            .run();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除题目错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

