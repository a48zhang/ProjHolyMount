import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withApiLogging } from '@/lib/logger';

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
        console.error('获取公开试卷详情错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const GET = withApiLogging(async (request: Request) => {
    const { env } = await getCloudflareContext();
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    return getPublicExamWithEnv(env as any, examId);
});



