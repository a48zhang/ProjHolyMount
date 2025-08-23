import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

// 查看提交详情（学生看自己的；教师看自己创建试卷下的提交）
export const GET = withApiLogging(async (request: Request) => {
    try {
        const ctx = await getAuthContext(request);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'submissions');
        const submissionId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(submissionId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const sub = await ctx.env.DB
            .prepare('SELECT s.*, e.author_id, e.randomize FROM submissions s JOIN exams e ON e.id = s.exam_id WHERE s.id = ?')
            .bind(submissionId)
            .first<any>();
        if (!sub) return NextResponse.json({ success: false, error: '提交不存在' }, { status: 404 });

        if (ctx.userId !== sub.user_id && !(ctx.role !== 'student' && ctx.userId === sub.author_id)) {
            return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        }

        // 附上作答明细
        const answers = await ctx.env.DB
            .prepare('SELECT exam_question_id, answer_json, score, is_auto_scored FROM submission_answers WHERE submission_id = ? ORDER BY exam_question_id')
            .bind(submissionId)
            .all<any>();

        for (const r of answers.results || []) {
            r.answer_json = r.answer_json ? JSON.parse(r.answer_json) : null;
        }

        // 题面与标准答案（学生仅在提交后可见；教师/管理员可见）
        const canViewAnswers = (ctx.userId === sub.user_id && (sub.status === 'submitted' || sub.status === 'graded')) || ctx.userId === sub.author_id || ctx.role === 'admin';
        const eqs = await ctx.env.DB
            .prepare(`SELECT eq.id as exam_question_id, eq.points, q.id as question_id, q.type, q.schema_version, q.content_json, q.answer_key_json
                      FROM exam_questions eq JOIN questions q ON q.id = eq.question_id
                      WHERE eq.exam_id = ? ORDER BY eq.order_index ASC`)
            .bind(sub.exam_id)
            .all<any>();
        const paper = (eqs.results || []).map((r: any) => ({
            exam_question_id: r.exam_question_id,
            points: r.points,
            question: {
                id: r.question_id,
                type: r.type,
                schema_version: r.schema_version,
                content: r.content_json ? JSON.parse(r.content_json) : null,
                answer_key: canViewAnswers ? (r.answer_key_json ? JSON.parse(r.answer_key_json) : null) : undefined,
            },
        }));

        return NextResponse.json({ success: true, data: { submission: sub, answers: answers.results || [], paper } });
    } catch (error) {
        console.error('获取提交详情错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
});

