import test from 'tape';
import * as mod from '../../../app/api/exams/[id]/start/route';

test('startExamWithContext returns 402 when plan not sufficient', async (t) => {
    t.plan(1);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM exam_assignments')) return { id: 1 } as unknown as T;
                    if (sql.includes('FROM exams WHERE id = ?')) {
                        return { status: 'published', start_at: null, end_at: null, duration_minutes: null, required_plan: 'premium', required_grade_level: null } as unknown as T;
                    }
                    return null as unknown as T;
                }
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 1, username: 's', email: 'x', role: 'student', plan: 'free', grade_level: null };
    const res = await mod.startExamWithContext(ctx as any, 1);
    t.equal(res.status, 402);
});

test('startExamWithContext returns 403 when grade not matched', async (t) => {
    t.plan(1);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM exam_assignments')) return { id: 1 } as unknown as T;
                    if (sql.includes('FROM exams WHERE id = ?')) {
                        return { status: 'published', start_at: null, end_at: null, duration_minutes: null, required_plan: null, required_grade_level: 'G7' } as unknown as T;
                    }
                    return null as unknown as T;
                }
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 1, username: 's', email: 'x', role: 'student', plan: 'premium', grade_level: 'G8' };
    const res = await mod.startExamWithContext(ctx as any, 1);
    t.equal(res.status, 403);
});


