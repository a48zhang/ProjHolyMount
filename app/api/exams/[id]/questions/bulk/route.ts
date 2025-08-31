import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { setExamQuestionsWithContext } from '@/lib/exam-services';

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = await request.json();
    const { items } = body as { items: Array<{ question_id: number; order_index: number; points: number }> };
    return setExamQuestionsWithContext(ctx, examId, items);
});

