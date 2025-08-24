import { NextResponse } from 'next/server';
import { getAuthContext, AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

interface ExamInfo {
  id: number;
  author_id: number;
  status: string;
  start_at: string | null;
  end_at: string | null;
  required_plan: string | null;
  required_grade_level: string | null;
}

interface ExamQuestionRow {
  exam_question_id: number;
  points: number;
  question_id: number;
  type: string;
  schema_version: number;
  content_json: string;
  answer_key_json: string | null;
}

interface ExamQuestion {
  exam_question_id: number;
  points: number;
  question: {
    id: number;
    type: string;
    schema_version: number;
    content: unknown;
    answer_key?: unknown;
  };
}

// 获取试卷可作答内容（题目列表及分值）。
// 学生：仅可在被分配且发布窗口内访问，且不返回答案；
// 教师/管理员：仅可访问自己创建的试卷，支持 includeAnswers 查询参数。

function ensurePlan(ctx: AuthContext, requiredPlan: string | null): void {
  if (!requiredPlan) return;
  if (ctx.plan !== requiredPlan && ctx.role !== 'admin') {
    throw new Error('PLAN_REQUIRED');
  }
}

function ensureGrade(ctx: AuthContext, requiredGrade: string | null): void {
  if (!requiredGrade) return;
  if (ctx.grade_level !== requiredGrade && ctx.role !== 'admin') {
    throw new Error('GRADE_REQUIRED');
  }
}

async function getExamPaperWithContext(ctx: AuthContext, examId: number, wantAnswers: boolean) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        // 获取考试信息
        const exam = await ctx.env.DB
            .prepare('SELECT id, author_id, status, start_at, end_at, required_plan, required_grade_level FROM exams WHERE id = ?')
            .bind(examId)
            .first<ExamInfo>();
        
        if (!exam) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });

        // 权限校验
        let isAuthor = false;
        if (ctx.role === 'teacher' || ctx.role === 'admin') {
            isAuthor = exam.author_id === ctx.userId || ctx.role === 'admin';
            if (!isAuthor) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        } else {
            // 学生需已分配且在时间窗口内
            const assigned = await ctx.env.DB
                .prepare('SELECT 1 FROM exam_assignments WHERE exam_id = ? AND user_id = ?')
                .bind(examId, ctx.userId)
                .first();
            if (!assigned) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
            if (exam.status !== 'published') return NextResponse.json({ success: false, error: '试卷未发布' }, { status: 400 });
            const now = Date.now();
            const startOk = !exam.start_at || now >= Date.parse(exam.start_at);
            const endOk = !exam.end_at || now <= Date.parse(exam.end_at);
            if (!startOk || !endOk) return NextResponse.json({ success: false, error: '不在考试时间窗口内' }, { status: 400 });
            // 套餐/学段要求
            ensurePlan(ctx, exam.required_plan);
            ensureGrade(ctx, exam.required_grade_level);
        }

        // 拉取题目与分值
        const rows = await ctx.env.DB
            .prepare(
                'SELECT eq.id as exam_question_id, eq.points, q.id as question_id, q.type, q.schema_version, q.content_json, q.answer_key_json FROM exam_questions eq JOIN questions q ON q.id = eq.question_id WHERE eq.exam_id = ? ORDER BY eq.order_index ASC'
            )
            .bind(examId)
            .all<ExamQuestionRow>();

        let items: ExamQuestion[] = (rows.results || []).map((r) => ({
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

