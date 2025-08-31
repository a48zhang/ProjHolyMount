import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { getExamDetailWithContext, updateExamWithContext } from '@/lib/exam-services';

export const GET = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    return getExamDetailWithContext(ctx, id);
});

export const PATCH = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = (await request.json()) as any;
    return updateExamWithContext(ctx, id, body);
});

