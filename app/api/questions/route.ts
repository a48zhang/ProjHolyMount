import { NextResponse } from 'next/server';
import { getAuthContext, requireRole } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

// 创建题目
export async function createQuestionWithContext(
    ctx: AuthContext,
    body: { type: string; content_json: unknown; answer_key_json?: unknown; rubric_json?: unknown; schema_version?: number }
) {
    try {
        requireRole(ctx, ['teacher', 'admin']);
        const { type, content_json, answer_key_json, rubric_json, schema_version = 1 } = body;
        if (!type || !content_json) {
            return NextResponse.json({ success: false, error: '缺少题型或内容' }, { status: 400 });
        }
        await ctx.env.DB
            .prepare(
                `INSERT INTO questions (author_id, type, schema_version, content_json, answer_key_json, rubric_json, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
            )
            .bind(
                ctx.userId,
                type,
                schema_version,
                JSON.stringify(content_json),
                answer_key_json ? JSON.stringify(answer_key_json) : null,
                rubric_json ? JSON.stringify(rubric_json) : null
            )
            .run();
        const created = await ctx.env.DB
            .prepare('SELECT id FROM questions WHERE author_id = ? ORDER BY id DESC LIMIT 1')
            .bind(ctx.userId)
            .first<{ id: number }>();
        return NextResponse.json({ success: true, data: { id: created?.id } });
    } catch (error) {
        console.error('创建题目错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const body = (await request.json()) as { type: string; content_json: unknown; answer_key_json?: unknown; rubric_json?: unknown; schema_version?: number };
    return createQuestionWithContext(ctx, body);
});

// 列表题目（仅作者可见自己的题，admin 可见全部）
export const GET = withApiLogging(async (request: Request) => {
    try {
        const ctx = await getAuthContext(request);
        requireRole(ctx, ['teacher', 'admin']);

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
        const type = searchParams.get('type');
        const includeContent = searchParams.get('includeContent') === 'true';

        const selectCols = includeContent
            ? `id, author_id, type, schema_version, is_active, created_at, updated_at, content_json`
            : `id, author_id, type, schema_version, is_active, created_at, updated_at`;
        const baseSql =
            ctx.role === 'admin'
                ? `SELECT ${selectCols} FROM questions`
                : `SELECT ${selectCols} FROM questions WHERE author_id = ?`;

        const whereType = type ? (baseSql.includes('WHERE') ? ` AND type = ?` : ` WHERE type = ?`) : '';
        const orderLimit = ` ORDER BY id DESC LIMIT ? OFFSET ?`;

        const stmt = ctx.role === 'admin'
            ? ctx.env.DB.prepare(baseSql + whereType + orderLimit)
            : ctx.env.DB.prepare(baseSql + whereType + orderLimit);

        const binds: (string | number)[] = [];
        if (ctx.role !== 'admin') binds.push(ctx.userId);
        if (type) binds.push(type);
        binds.push(limit, offset);

        interface QuestionRow {
            id: number;
            author_id: number;
            type: string;
            schema_version: number;
            is_active: number;
            created_at: string;
            updated_at: string;
            content_json?: string;
        }

        const rows = await stmt.bind(...binds).all<QuestionRow>();
        const results = (rows.results || []).map((r) => ({
            ...r,
            ...(includeContent ? { content_json: r.content_json ? JSON.parse(r.content_json) : null } : {}),
        }));
        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('获取题目列表错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
});

