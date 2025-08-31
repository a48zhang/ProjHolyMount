import test from 'tape';
import { startExamWithContext } from '../../../lib/exam-services';

test('startExamWithContext returns 403 when not assigned', async (t) => {
    t.plan(1);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM exams WHERE id = ?')) {
                        return { status: 'published', start_at: null, end_at: null, duration_minutes: null, required_plan: null, required_grade_level: null, is_public: 0 } as unknown as T;
                    }
                    if (sql.includes('FROM exam_assignments WHERE exam_id = ? AND user_id = ?')) {
                        return null as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => ({ success: true })
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 9, username: 's', email: 'x', role: 'student', plan: 'free', grade_level: null };
    const res = await startExamWithContext(ctx as any, 1);
    t.equal(res.status, 403);
});

test('startExamWithContext returns 400 when exam not published', async (t) => {
    t.plan(1);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM exams WHERE id = ?')) return { status: 'draft', start_at: null, end_at: null, duration_minutes: null, required_plan: null, required_grade_level: null } as unknown as T;
                    if (sql.includes('FROM exam_assignments')) return { id: 1 } as unknown as T;
                    return null as unknown as T;
                }
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 1, username: 's', email: 'x', role: 'student', plan: 'free', grade_level: null };
    const res = await startExamWithContext(ctx as any, 1);
    t.equal(res.status, 400);
});

test('startExamWithContext returns 400 when out of time window', async (t) => {
    t.plan(1);
    const future = new Date(Date.now() + 3600_000).toISOString();
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM exams WHERE id = ?')) return { status: 'published', start_at: future, end_at: null, duration_minutes: null, required_plan: null, required_grade_level: null } as unknown as T;
                    if (sql.includes('FROM exam_assignments')) return { id: 1 } as unknown as T;
                    return null as unknown as T;
                }
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 1, username: 's', email: 'x', role: 'student', plan: 'free', grade_level: null };
    const res = await startExamWithContext(ctx as any, 1);
    t.equal(res.status, 400);
});


