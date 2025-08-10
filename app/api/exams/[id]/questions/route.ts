import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

// 教师/管理员：查看试卷已挂题目（含 content，不返回答案）
export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'exams');
        const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const own = await ctx.env.DB.prepare('SELECT author_id FROM exams WHERE id = ?').bind(examId).first<{ author_id: number }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        const isAuthor = own.author_id === ctx.userId || ctx.role === 'admin';
        if (!isAuthor) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });

        const rows = await ctx.env.DB
            .prepare(`
        SELECT eq.id as exam_question_id, eq.order_index, eq.points,
               q.id as question_id, q.type, q.schema_version, q.content_json, q.rubric_json
        FROM exam_questions eq
        JOIN questions q ON q.id = eq.question_id
        WHERE eq.exam_id = ?
        ORDER BY eq.order_index ASC
      `)
            .bind(examId)
            .all<any>();

        const items = (rows.results || []).map(r => ({
            exam_question_id: r.exam_question_id,
            question_id: r.question_id,
            order_index: r.order_index,
            points: r.points,
            question: {
                id: r.question_id,
                type: r.type,
                schema_version: r.schema_version,
                content_json: r.content_json ? JSON.parse(r.content_json) : null,
                rubric_json: r.rubric_json ? JSON.parse(r.rubric_json) : null,
            },
        }));

        return NextResponse.json({ success: true, data: { items } });
    } catch (error) {
        console.error('获取试卷题目错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}




