import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { saveAnswersWithContext } from '@/lib/exam-services';

export const PUT = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'submissions');
    const submissionId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = await request.json();
    const { items } = body as { items: Array<{ exam_question_id: number; answer_json: unknown }> };
    return saveAnswersWithContext(ctx, submissionId, items);
});

