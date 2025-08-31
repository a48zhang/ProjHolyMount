import { getCloudflareContext } from '@opennextjs/cloudflare';
import { withApiLogging } from '@/lib/logger';
import { getPublicExamWithEnv } from '@/lib/exam-services';

export const GET = withApiLogging(async (request: Request) => {
    const { env } = await getCloudflareContext();
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    return getPublicExamWithEnv(env, examId);
});



