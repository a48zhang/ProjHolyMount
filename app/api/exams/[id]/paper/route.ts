import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';
import { getExamPaperWithContext } from '@/lib/exam-services';

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

