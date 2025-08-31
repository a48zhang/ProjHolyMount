import { NextResponse } from 'next/server';
import type { AuthContext } from './auth';

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

export async function assignExamWithContext(
    ctx: AuthContext,
    id: number,
    user_ids: number[],
    due_at: string | null
) {
    try {
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const own = await ctx.env.DB
            .prepare('SELECT author_id, status FROM exams WHERE id = ?')
            .bind(id)
            .first<{ author_id: number; status: string }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        if (own.status !== 'published') return NextResponse.json({ success: false, error: '仅发布后可分配' }, { status: 400 });

        if (!Array.isArray(user_ids) || user_ids.length === 0) return NextResponse.json({ success: false, error: '缺少学生列表' }, { status: 400 });

        let successCount = 0;
        for (const uid of user_ids) {
            try {
                await ctx.env.DB
                    .prepare(`INSERT INTO exam_assignments (exam_id, user_id, assigned_at, due_at) VALUES (?, ?, datetime('now'), ?)`)
                    .bind(id, uid, due_at)
                    .run();
                successCount += 1;
            } catch (e) {
                // 唯一约束冲突忽略
            }
        }
        return NextResponse.json({ success: true, data: { assigned: successCount } });
    } catch (error) {
        console.error('分配试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export async function listAssignmentsWithContext(ctx: AuthContext, examId: number) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const own = await ctx.env.DB.prepare('SELECT author_id FROM exams WHERE id = ?').bind(examId).first<{ author_id: number }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        const rows = await ctx.env.DB
            .prepare('SELECT id, exam_id, user_id, assigned_at, due_at FROM exam_assignments WHERE exam_id = ? ORDER BY id DESC')
            .bind(examId)
            .all<any>();
        return NextResponse.json({ success: true, data: { assignments: rows.results || [] } });
    } catch (error) {
        console.error('获取试卷分配列表错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export async function deleteAssignmentsWithContext(ctx: AuthContext, examId: number, ids: number[]) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const own = await ctx.env.DB.prepare('SELECT author_id FROM exams WHERE id = ?').bind(examId).first<{ author_id: number }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });

        if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ success: false, error: '缺少ID列表' }, { status: 400 });

        // 动态占位符
        const placeholders = ids.map(() => '?').join(',');
        await ctx.env.DB
            .prepare(`DELETE FROM exam_assignments WHERE exam_id = ? AND id IN (${placeholders})`)
            .bind(examId, ...ids)
            .run();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('撤销分配错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export async function closeExamWithContext(ctx: AuthContext, examId: number) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const own = await ctx.env.DB.prepare('SELECT author_id FROM exams WHERE id = ?').bind(examId).first<{ author_id: number }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        await ctx.env.DB.prepare("UPDATE exams SET status='closed', updated_at=datetime('now') WHERE id = ?").bind(examId).run();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('关闭试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

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

// 获取试卷可作答内容（题目列表及分值）。
// 学生：仅可在被分配且发布窗口内访问，且不返回答案；
// 教师/管理员：仅可访问自己创建的试卷，支持 includeAnswers 查询参数。
export async function getExamPaperWithContext(ctx: AuthContext, examId: number, wantAnswers: boolean) {
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

export async function setExamQuestionsWithContext(
    ctx: AuthContext,
    examId: number,
    items: Array<{ question_id: number; order_index: number; points: number }>
) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const own = await ctx.env.DB
            .prepare('SELECT author_id, status FROM exams WHERE id = ?')
            .bind(examId)
            .first<{ author_id: number; status: string }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        if (own.status !== 'draft') return NextResponse.json({ success: false, error: '仅草稿可编辑题目' }, { status: 400 });

        if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ success: false, error: '缺少题目列表' }, { status: 400 });

        // 清空现有关联
        await ctx.env.DB.prepare('DELETE FROM exam_questions WHERE exam_id = ?').bind(examId).run();

        // 批量插入
        let totalPoints = 0;
        for (const it of items) {
            totalPoints += (it.points || 0);
            await ctx.env.DB
                .prepare('INSERT INTO exam_questions (exam_id, question_id, order_index, points) VALUES (?, ?, ?, ?)')
                .bind(examId, it.question_id, it.order_index, it.points)
                .run();
        }
        await ctx.env.DB.prepare('UPDATE exams SET total_points = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(totalPoints, examId).run();

        return NextResponse.json({ success: true, data: { total_points: totalPoints } });
    } catch (error) {
        console.error('批量设置试卷题目错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 获取试卷详情
export async function getExamDetailWithContext(ctx: AuthContext, id: number) {
    try {
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        // 教师可看自己创建的；学生仅可看被分配的
        let row: any | null = null;
        if (ctx.role === 'teacher' || ctx.role === 'admin') {
            row = await ctx.env.DB.prepare('SELECT * FROM exams WHERE id = ? AND author_id = ?').bind(id, ctx.userId).first<any>();
        }
        if (!row && ctx.role === 'student') {
            row = await ctx.env.DB
                .prepare('SELECT e.* FROM exams e JOIN exam_assignments a ON a.exam_id = e.id AND a.user_id = ? WHERE e.id = ?')
                .bind(ctx.userId, id)
                .first<any>();
        }
        if (!row) return NextResponse.json({ success: false, error: '无权访问或不存在' }, { status: 404 });
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        console.error('获取试卷详情错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 更新试卷（草稿阶段）
export async function updateExamWithContext(
    ctx: AuthContext,
    id: number,
    body: { title?: string; description?: string; duration_minutes?: number; randomize?: boolean; required_plan?: string | null; required_grade_level?: string | null; is_public?: boolean }
) {
    try {
        if (!Number.isFinite(id)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        // 仅作者可改
        const own = await ctx.env.DB.prepare('SELECT author_id, status FROM exams WHERE id = ?').bind(id).first<{ author_id: number; status: string }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权操作' }, { status: 403 });
        if (own.status !== 'draft') return NextResponse.json({ success: false, error: '非草稿不可修改' }, { status: 400 });

        const { title, description, duration_minutes, randomize, required_plan, required_grade_level, is_public } = body;

        await ctx.env.DB
            .prepare(
                `UPDATE exams SET
           title = COALESCE(?, title),
           description = COALESCE(?, description),
           duration_minutes = COALESCE(?, duration_minutes),
           randomize = COALESCE(?, randomize),
           is_public = COALESCE(?, is_public),
           required_plan = COALESCE(?, required_plan),
           required_grade_level = COALESCE(?, required_grade_level),
           updated_at = datetime('now')
         WHERE id = ?`
            )
            .bind(
                title ?? null,
                description ?? null,
                typeof duration_minutes === 'number' ? duration_minutes : null,
                typeof randomize === 'boolean' ? (randomize ? 1 : 0) : null,
                typeof is_public === 'boolean' ? (is_public ? 1 : 0) : null,
                required_plan ?? null,
                required_grade_level ?? null,
                id
            )
            .run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('更新试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 获取试卷题目列表（教师视图）
export async function listExamQuestionsWithContext(ctx: AuthContext, examId: number) {
    try {
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

export async function saveAnswersWithContext(ctx: AuthContext, submissionId: number, items: Array<{ exam_question_id: number; answer_json: unknown }>) {
    try {
        if (!Number.isFinite(submissionId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const sub = await ctx.env.DB
            .prepare('SELECT exam_id, user_id, status FROM submissions WHERE id = ?')
            .bind(submissionId)
            .first<{ exam_id: number; user_id: number; status: string }>();
        if (!sub) return NextResponse.json({ success: false, error: '提交不存在' }, { status: 404 });
        if (sub.user_id !== ctx.userId) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        if (sub.status !== 'in_progress') return NextResponse.json({ success: false, error: '提交已结束，不可修改' }, { status: 400 });

        if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ success: false, error: '缺少答案列表' }, { status: 400 });

        let savedCount = 0;
        for (const it of items) {
            if (!Number.isFinite(it.exam_question_id)) continue;
            await ctx.env.DB
                .prepare('INSERT OR REPLACE INTO submission_answers (submission_id, exam_question_id, answer_json, updated_at) VALUES (?, ?, ?, datetime(\'now\'))')
                .bind(submissionId, it.exam_question_id, JSON.stringify(it.answer_json))
                .run();
            savedCount++;
        }

        return NextResponse.json({ success: true, data: { saved: savedCount } });
    } catch (error) {
        console.error('保存答案错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export async function submitWithContext(ctx: AuthContext, submissionId: number) {
    try {
        if (!Number.isFinite(submissionId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const sub = await ctx.env.DB
            .prepare('SELECT exam_id, user_id, status FROM submissions WHERE id = ?')
            .bind(submissionId)
            .first<{ exam_id: number; user_id: number; status: string }>();
        if (!sub) return NextResponse.json({ success: false, error: '提交不存在' }, { status: 404 });
        if (sub.user_id !== ctx.userId) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        if (sub.status !== 'in_progress') return NextResponse.json({ success: false, error: '提交已结束' }, { status: 400 });

        // 计算分数
        // 1) 拉取题目与答案键（按测试桩的 SQL 片段匹配）
        const questionRows = await ctx.env.DB
            .prepare(`SELECT eq.id as exam_question_id, eq.points, q.type, q.answer_key_json FROM exam_questions eq JOIN questions q ON q.id = eq.question_id WHERE eq.exam_id = (SELECT exam_id FROM submissions WHERE id = ?)`)
            .bind(submissionId)
            .all<any>();

        // 2) 拉取用户作答
        const answerRows = await ctx.env.DB
            .prepare(`SELECT exam_question_id, answer_json FROM submission_answers WHERE submission_id = ?`)
            .bind(submissionId)
            .all<any>();

        console.log('submitWithContext debug: questionRows=', (questionRows as any)?.results?.length || 0, 'answerRows=', (answerRows as any)?.results?.length || 0);

        let totalScore = 0;
        const answerMap = new Map<number, any>();
        for (const ar of (answerRows.results || [])) {
            answerMap.set(ar.exam_question_id, ar.answer_json ? JSON.parse(ar.answer_json) : null);
        }

        const results = (questionRows.results || []).map((row: any) => {
            const userAnswer = answerMap.get(row.exam_question_id) ?? null;
            const correctAnswer = row.answer_key_json ? JSON.parse(row.answer_key_json) : null;
            const points = row.points || 0;
            let score = 0;

            console.log(`Question ${row.exam_question_id}: type=${row.type}, userAnswer=${JSON.stringify(userAnswer)}, correctAnswer=${JSON.stringify(correctAnswer)}, points=${points}`);

            if (row.type === 'single_choice') {
                if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
                    score = points;
                }
            } else if (row.type === 'multiple_choice') {
                if (userAnswer && correctAnswer && Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                    const userSorted = [...userAnswer].sort();
                    const correctSorted = [...correctAnswer].sort();
                    console.log(`Multiple choice comparison: userSorted=${JSON.stringify(userSorted)}, correctSorted=${JSON.stringify(correctSorted)}`);
                    if (JSON.stringify(userSorted) === JSON.stringify(correctSorted)) {
                        score = points;
                    }
                }
            } else if (row.type === 'fill_blank') {
                if (userAnswer && correctAnswer && Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                    const correctCount = userAnswer.filter((ans, idx) =>
                        ans && correctAnswer[idx] && ans.toString().toLowerCase() === correctAnswer[idx].toString().toLowerCase()
                    ).length;
                    score = points * (correctCount / correctAnswer.length);
                }
            }

            console.log(`Question ${row.exam_question_id} score: ${score}`);
            totalScore += score;
            return {
                exam_question_id: row.exam_question_id,
                score,
                points,
                correct: score === points,
            };
        });

        console.log('Total score:', totalScore);

        await ctx.env.DB
            .prepare("UPDATE submissions SET status = 'submitted', score_auto = ?, score_total = score_manual + ?, submitted_at = datetime('now') WHERE id = ?")
            .bind(totalScore, totalScore, submissionId)
            .run();

        return NextResponse.json({ success: true, data: { score_auto: totalScore } });
    } catch (error) {
        console.error('提交考试错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export async function createQuestionWithContext(
    ctx: AuthContext,
    body: { type: string; content_json: unknown; answer_key_json?: unknown; rubric_json?: unknown; schema_version?: number }
) {
    try {
        // 验证角色权限
        if (ctx.role !== 'teacher' && ctx.role !== 'admin') {
            return NextResponse.json({ success: false, error: '无权创建题目' }, { status: 403 });
        }

        const { type, content_json, answer_key_json, rubric_json, schema_version = 1 } = body;
        if (!type || !content_json) {
            return NextResponse.json({ success: false, error: '缺少题型或内容' }, { status: 400 });
        }

        const result = await ctx.env.DB
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

        const id = result.meta?.last_row_id;
        if (!id) {
            return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { id } });
    } catch (error) {
        console.error('创建题目错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export async function startExamWithContext(ctx: AuthContext, examId: number) {
    try {
        const exam = await ctx.env.DB
            .prepare('SELECT status, start_at, end_at, duration_minutes, required_plan, required_grade_level, is_public FROM exams WHERE id = ?')
            .bind(examId)
            .first<{ status: string; start_at: string | null; end_at: string | null; duration_minutes: number | null; required_plan: string | null; required_grade_level: string | null; is_public: number }>();
        if (!exam) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (exam.status !== 'published') return NextResponse.json({ success: false, error: '试卷未发布' }, { status: 400 });

        const now = Date.now();
        const startOk = !exam.start_at || now >= Date.parse(exam.start_at);
        const endOk = !exam.end_at || now <= Date.parse(exam.end_at);
        if (!startOk || !endOk) return NextResponse.json({ success: false, error: '不在考试时间窗口内' }, { status: 400 });

        // 学生必须已被分配
        const assigned = await ctx.env.DB
            .prepare('SELECT 1 FROM exam_assignments WHERE exam_id = ? AND user_id = ?')
            .bind(examId, ctx.userId)
            .first<any>();
        if (!assigned) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });

        // 套餐/学段要求
        try {
            ensurePlan(ctx, exam.required_plan);
        } catch (e) {
            return NextResponse.json({ success: false, error: '套餐不满足' }, { status: 402 });
        }
        try {
            ensureGrade(ctx, exam.required_grade_level);
        } catch (e) {
            return NextResponse.json({ success: false, error: '学段不匹配' }, { status: 403 });
        }

        // 是否已有提交
        const existing = await ctx.env.DB
            .prepare("SELECT id, status FROM submissions WHERE exam_id = ? AND user_id = ?")
            .bind(examId, ctx.userId)
            .first<{ id: number; status: string }>();

        if (existing) {
            if (existing.status === 'in_progress') {
                return NextResponse.json({ success: true, data: { submission_id: existing.id } });
            }
            return NextResponse.json({ success: false, error: '已提交过试卷' }, { status: 400 });
        }

        const result = await ctx.env.DB
            .prepare("INSERT INTO submissions (exam_id, user_id, status, created_at) VALUES (?, ?, 'in_progress', datetime('now'))")
            .bind(examId, ctx.userId)
            .run();

        const submissionId = result.meta?.last_row_id;
        if (!submissionId) {
            return NextResponse.json({ success: false, error: '创建提交失败' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { submission_id: submissionId } });
    } catch (error) {
        console.error('开始考试错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

// 公开试卷详情（无需登录）。仅当考试已发布且 is_public=1 时返回
export async function getPublicExamWithEnv(env: any, examId: number) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const exam = await env.DB
            .prepare(`SELECT id, title, description, total_points, status, start_at, end_at, duration_minutes, is_public, created_at, updated_at
                FROM exams WHERE id = ? AND status = 'published' AND is_public = 1`)
            .bind(examId)
            .first();
        if (!exam) return NextResponse.json({ success: false, error: '试卷不存在或未公开' }, { status: 404 });
        const countRow = await env.DB
            .prepare(`SELECT COUNT(1) as cnt FROM exam_questions WHERE exam_id = ?`)
            .bind(examId)
            .first();
        return NextResponse.json({ success: true, data: { ...exam, question_count: countRow?.cnt ?? 0 } });
    } catch (error) {
        console.error('获取公开试卷错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}
