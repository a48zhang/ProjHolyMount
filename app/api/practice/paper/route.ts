import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

const VALID_TYPES = new Set([
    'single_choice',
    'multiple_choice',
    'fill_blank',
    'short_answer',
    'essay',
]);

export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        const url = new URL(request.url);

        const countParam = url.searchParams.get('count');
        const parsedCount = Number.parseInt(countParam || '10', 10);
        const questionCount = Number.isFinite(parsedCount)
            ? Math.max(1, Math.min(50, parsedCount))
            : 10;

        const typeParam = url.searchParams.get('type');
        const typeFilter = typeParam && VALID_TYPES.has(typeParam) ? typeParam : null;

        let sql = 'SELECT id, type, schema_version, content_json FROM questions WHERE is_active = 1';
        const binds: unknown[] = [];
        if (typeFilter) {
            sql += ' AND type = ?';
            binds.push(typeFilter);
        }
        sql += ' ORDER BY RANDOM() LIMIT ?';
        binds.push(questionCount);

        const rows = await ctx.env.DB
            .prepare(sql)
            .bind(...binds)
            .all<{
                id: number;
                type: string;
                schema_version: number;
                content_json: string | null;
            }>();

        const items = (rows.results || []).map(r => ({
            question_id: r.id,
            type: r.type,
            schema_version: r.schema_version,
            content: r.content_json ? JSON.parse(r.content_json) : null,
        }));

        return NextResponse.json({ success: true, data: { items } });
    } catch (error) {
        console.error('获取练习题失败:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}





