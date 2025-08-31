import test from 'tape';
import { closeExamWithContext, assignExamWithContext, getExamDetailWithContext, getPublicExamWithEnv } from '../../../lib/exam-services';

test('close exam by author', async (t) => {
    t.plan(1);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id FROM exams WHERE id = ?')) return { author_id: 10 } as unknown as T;
                    return null as unknown as T;
                },
                run: async () => ({ success: true }),
                all: async <T>() => ({ results: [] as T[] }),
            }),
        }),
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res = await closeExamWithContext(ctx as any, 1);
    t.equal(res.status, 200);
});

test('assign exam to users by author', async (t) => {
    t.plan(2);
    const inserted: any[] = [];
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (...args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id, status FROM exams WHERE id = ?')) return { author_id: 10, status: 'published' } as unknown as T;
                    return null as unknown as T;
                },
                run: async () => { inserted.push({ sql, args }); return { success: true }; },
                all: async <T>() => ({ results: [] as T[] }),
            }),
        }),
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res = await assignExamWithContext(ctx as any, 1, [101, 102], null);
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.data.assigned, 2);
});

test('get exam detail by author or assigned student', async (t) => {
    t.plan(2);
    const dbStubAuthor = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT * FROM exams WHERE id = ? AND author_id = ?')) return { id: 1, title: 'x' } as unknown as T;
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => ({ success: true }),
            })
        })
    };
    const ctxAuthor = { env: { DB: dbStubAuthor }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res1 = await getExamDetailWithContext(ctxAuthor as any, 1);
    t.equal(res1.status, 200);

    const dbStubStudent = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('JOIN exam_assignments')) return { id: 1, title: 'x' } as unknown as T;
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => ({ success: true }),
            })
        })
    };
    const ctxStudent = { env: { DB: dbStubStudent }, userId: 201, username: 's', email: 'x', role: 'student', plan: 'free', grade_level: null };
    const res2 = await getExamDetailWithContext(ctxStudent as any, 1);
    t.equal(res2.status, 200);
});

test('public exam detail without auth', async (t) => {
    t.plan(2);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes("FROM exams WHERE id = ? AND status = 'published' AND is_public = 1")) {
                        return { id: 1, title: 'x', status: 'published', is_public: 1 } as unknown as T;
                    }
                    if (sql.includes('SELECT COUNT(1) as cnt FROM exam_questions WHERE exam_id = ?')) {
                        return { cnt: 3 } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => ({ success: true }),
            })
        })
    } as any;
    const res = await getPublicExamWithEnv({ DB: dbStub } as any, 1);
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.data.question_count, 3);
});


