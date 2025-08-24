import { NextResponse } from 'next/server';
import { ensureGrade, ensurePlan, getAuthContext, requireAssigned } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

async function startExamWithContext(ctx: AuthContext, examId: number) {
    try {
        const exam = await ctx.env.DB
            .prepare('SELECT status, start_at, end_at, duration_minutes, required_plan, required_grade_level, is_public FROM exams WHERE id = ?')
            .bind(examId)
            .first<{ status: string; start_at: string | null; end_at: string | null; duration_minutes: number | null; required_plan: string | null; required_grade_level: string | null; is_public: number }>();
        if (!exam) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (exam.status !== 'published') return NextResponse.json({ success: false, error: '试卷未发布' }, { status: 400 });

        // 学生：公开试卷放开分配校验；非公开需被分配
        if (ctx.role === 'student' && !exam.is_public) {
            await requireAssigned(ctx, examId);
        }

        const now = Date.now();
        const startOk = !exam.start_at || now >= Date.parse(exam.start_at);
        const endOk = !exam.end_at || now <= Date.parse(exam.end_at);
        if (!startOk || !endOk) return NextResponse.json({ success: false, error: '不在考试时间窗口内' }, { status: 400 });

        ensurePlan(ctx, exam.required_plan);
        ensureGrade(ctx, exam.required_grade_level);

        // 是否已有提交
        const existing = await ctx.env.DB
            .prepare("SELECT id, status FROM submissions WHERE exam_id = ? AND user_id = ?")
            .bind(examId, ctx.userId)
            .first<{ id: number; status: string }>();
        if (existing) {
            // 允许重复进入继续作答
            return NextResponse.json({ success: true, data: { submission_id: existing.id } });
        }

        const deadlineAt = exam.duration_minutes ? new Date(now + exam.duration_minutes * 60 * 1000).toISOString() : null;
        await ctx.env.DB
            .prepare("INSERT INTO submissions (exam_id, user_id, status, started_at, deadline_at) VALUES (?, ?, 'in_progress', datetime('now'), ?)")
            .bind(examId, ctx.userId, deadlineAt)
            .run();
        const created = await ctx.env.DB
            .prepare('SELECT id FROM submissions WHERE exam_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1')
            .bind(examId, ctx.userId)
            .first<{ id: number }>();

        return NextResponse.json({ success: true, data: { submission_id: created?.id } });
    } catch (error) {
        const msg = (error as Error)?.message;
        if (msg === 'FORBIDDEN') return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        if (msg === 'PAYMENT_REQUIRED') return NextResponse.json({ success: false, error: '需要升级套餐' }, { status: 402 });
        if (msg === 'FORBIDDEN_GRADE') return NextResponse.json({ success: false, error: '年级不符合要求' }, { status: 403 });
        console.error('开始考试错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    return startExamWithContext(ctx, examId);
});

