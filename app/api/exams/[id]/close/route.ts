import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { closeExamWithContext } from '@/lib/exam-services';

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    return closeExamWithContext(ctx, examId);
});




