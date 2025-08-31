import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { assignExamWithContext } from '@/lib/exam-services';

export const POST = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const id = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    const body = await request.json();
    const { user_ids = [], due_at = null } = body as { user_ids: number[]; due_at?: string | null };
    return assignExamWithContext(ctx, id, user_ids, due_at);
});

