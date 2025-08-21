import test from 'tape';
import { requireRole, ensurePlan, ensureGrade, requireExamAuthor, requireAssigned } from '../../../lib/auth';

function buildCtx(overrides: Partial<any> = {}) {
    const base = { env: { DB: null }, userId: 1, username: 'u', email: 'e', role: 'student', plan: 'free', grade_level: null };
    return { ...base, ...overrides } as any;
}

test('requireRole allows when included and rejects otherwise', (t) => {
    t.plan(2);
    const ctx = buildCtx({ role: 'teacher' });
    t.doesNotThrow(() => requireRole(ctx, ['teacher', 'admin']));
    t.throws(() => requireRole(buildCtx({ role: 'student' }), 'teacher'), /FORBIDDEN/);
});

test('ensurePlan and ensureGrade', (t) => {
    t.plan(3);
    const ctx = buildCtx({ plan: 'free', grade_level: 'G7' });
    t.doesNotThrow(() => ensurePlan(ctx, null));
    t.throws(() => ensurePlan(ctx, 'premium'), /PAYMENT_REQUIRED/);
    t.throws(() => ensureGrade(buildCtx({ grade_level: 'G8' }), 'G7'), /FORBIDDEN_GRADE/);
});

test('requireExamAuthor with DB stub', async (t) => {
    t.plan(3);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id FROM exams WHERE id = ?')) return { author_id: 10 } as unknown as T;
                    return null as unknown as T;
                }
            })
        })
    };
    await requireExamAuthor(buildCtx({ env: { DB: dbStub }, userId: 10 }), 1);
    t.pass('author allowed');
    await requireExamAuthor(buildCtx({ env: { DB: dbStub }, role: 'admin' }), 1);
    t.pass('admin allowed');
    try {
        await requireExamAuthor(buildCtx({ env: { DB: dbStub }, userId: 2 }), 1);
        t.fail('should throw FORBIDDEN');
    } catch (e: any) {
        t.equal(e.message, 'FORBIDDEN');
    }
});

test('requireAssigned with DB stub', async (t) => {
    t.plan(2);
    const okDb = { prepare: (_: string) => ({ bind: (_examId: number, _uid: number) => ({ first: async () => ({ id: 1 }) }) }) };
    await requireAssigned(buildCtx({ env: { DB: okDb } }), 1);
    t.pass('assigned');
    const noDb = { prepare: (_: string) => ({ bind: (_examId: number, _uid: number) => ({ first: async () => null }) }) };
    try {
        await requireAssigned(buildCtx({ env: { DB: noDb } }), 1);
        t.fail('should throw FORBIDDEN');
    } catch (e: any) {
        t.equal(e.message, 'FORBIDDEN');
    }
});


