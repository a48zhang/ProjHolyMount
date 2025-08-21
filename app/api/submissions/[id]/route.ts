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
            .prepare('SELECT s.*, e.author_id FROM submissions s JOIN exams e ON e.id = s.exam_id WHERE s.id = ?')
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

        return NextResponse.json({ success: true, data: { submission: sub, answers: answers.results || [] } });
    } catch (error) {
        console.error('获取提交详情错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
});

