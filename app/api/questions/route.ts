import { NextResponse } from 'next/server';
import { getAuthContext, requireRole } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { createQuestionWithContext } from '@/lib/exam-services';

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    requireRole(ctx, ['teacher', 'admin']);
    const body = (await request.json()) as { type: string; content_json: unknown; answer_key_json?: unknown; rubric_json?: unknown; schema_version?: number };
    return createQuestionWithContext(ctx, body);
});

// 列表题目（支持公开题库查询）
export const GET = withApiLogging(async (request: Request) => {
    try {
        const ctx = await getAuthContext(request);
        const { searchParams } = new URL(request.url);
        const publicOnly = searchParams.get('public') === 'true';
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
        const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
        const type = searchParams.get('type');
        const includeContent = searchParams.get('includeContent') === 'true';

        // 如果要求公开题库，允许所有用户访问
        if (publicOnly) {
            const selectCols = includeContent
                ? `q.id, q.type, q.schema_version, q.is_active, q.created_at, q.content_json, u.username as author_name`
                : `q.id, q.type, q.schema_version, q.is_active, q.created_at, u.username as author_name`;
            
            let sql = `SELECT ${selectCols} FROM questions q 
                      JOIN users u ON q.author_id = u.id 
                      WHERE q.is_active = 1`;
            const binds: (string | number)[] = [];

            if (type) {
                sql += ` AND q.type = ?`;
                binds.push(type);
            }

            sql += ` ORDER BY q.id DESC LIMIT ? OFFSET ?`;
            binds.push(limit, offset);

            interface QuestionRow {
                id: number;
                type: string;
                schema_version: number;
                is_active: number;
                created_at: string;
                content_json?: string;
                author_name?: string;
            }

            const rows = await ctx.env.DB.prepare(sql).bind(...binds).all<QuestionRow>();
            const results = (rows.results || []).map((r) => ({
                ...r,
                ...(includeContent ? { content_json: r.content_json ? JSON.parse(r.content_json) : null } : {}),
            }));
            return NextResponse.json({ success: true, data: results });
        }

        // 原有的权限控制逻辑
        requireRole(ctx, ['teacher', 'admin']);

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

