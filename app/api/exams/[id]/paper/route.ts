import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

// 获取试卷可作答内容（题目列表及分值）。
// 学生：仅可在被分配且发布窗口内访问，且不返回答案；
// 教师/管理员：仅可访问自己创建的试卷，支持 includeAnswers 查询参数。
export async function getExamPaperWithContext(ctx: AuthContext, examId: number, wantAnswers: boolean) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        // 权限校验
        let canView = false;
        let isAuthor = false;
        if (ctx.role === 'teacher' || ctx.role === 'admin') {
            const own = await ctx.env.DB
                .prepare('SELECT author_id FROM exams WHERE id = ?')
                .bind(examId)
                .first<{ author_id: number }>();
            if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
            isAuthor = own.author_id === ctx.userId || ctx.role === 'admin';
            canView = isAuthor;
        } else {
            // 学生需已分配
            const assigned = await ctx.env.DB
                .prepare('SELECT 1 FROM exam_assignments WHERE exam_id = ? AND user_id = ?')
                .bind(examId, ctx.userId)
                .first<{ 1: number }>();
            canView = !!assigned;
        }
        if (!canView) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });

        // 拉取题目与分值
        const rows = await ctx.env.DB
            .prepare(
                'SELECT eq.id as exam_question_id, eq.points, q.id as question_id, q.type, q.schema_version, q.content_json, q.answer_key_json FROM exam_questions eq JOIN questions q ON q.id = eq.question_id WHERE eq.exam_id = ? ORDER BY eq.order_index ASC'
            )
            .bind(examId)
            .all<{
                exam_question_id: number;
                points: number;
                question_id: number;
                type: string;
                schema_version: number;
                content_json: string | null;
                answer_key_json: string | null;
            }>();

        let items = (rows.results || []).map(r => ({
            exam_question_id: r.exam_question_id,
            points: r.points,
            question: {
                id: r.question_id,
                type: r.type,
                schema_version: r.schema_version,
                content: r.content_json ? JSON.parse(r.content_json) : null,
                // 仅作者/管理员且显式请求时返回答案
                answer_key: wantAnswers && isAuthor ? (r.answer_key_json ? JSON.parse(r.answer_key_json) : null) : undefined,
            },
        }));

        // 随机出题：当考试设置 randomize=1 且当前为学生作答视图时对每个学生稳定乱序
        if (!isAuthor) {
            const exam = await ctx.env.DB
                .prepare('SELECT randomize FROM exams WHERE id = ?')
                .bind(examId)
                .first<{ randomize: number }>();
            if (exam && exam.randomize) {
                // 稳定乱序：使用 userId 作为种子，打乱但同一学生每次一致
                const seed = ctx.userId;
                let s = Number(seed) || 1;
                const rand = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return Math.abs(s) / 0x7fffffff; };
                items = [...items].sort(() => rand() - 0.5);
            }
        }

        return NextResponse.json({ success: true, data: { exam_id: examId, items } });
    } catch (error) {
        console.error('获取试卷作答内容错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const GET = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const includeAnswersParam = url.searchParams.get('includeAnswers');
    const wantAnswers = includeAnswersParam === 'true';
    return getExamPaperWithContext(ctx, examId, wantAnswers);
});

