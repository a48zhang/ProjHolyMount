import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { listAssignmentsWithContext, deleteAssignmentsWithContext } from '@/lib/exam-services';

export const GET = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    return listAssignmentsWithContext(ctx, examId);
});

export const DELETE = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = await request.json() as { ids: number[] };
    const ids = Array.isArray(body?.ids) ? body.ids.filter(n => Number.isFinite(n)) : [];
    return deleteAssignmentsWithContext(ctx, examId, ids);
});




