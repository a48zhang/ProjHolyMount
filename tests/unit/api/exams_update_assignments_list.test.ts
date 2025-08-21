import test from 'tape';
import * as examsMod from '../../../app/api/exams/[id]/route';
import * as assignmentsMod from '../../../app/api/exams/[id]/assignments/route';

test('PATCH /api/exams/[id] updates draft exam settings', async (t) => {
    t.plan(1);
    const updates: any[] = [];
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (...args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id, status FROM exams WHERE id = ?')) {
                        return { author_id: 10, status: 'draft' } as unknown as T;
                    }
                    return null as unknown as T;
                },
                run: async () => { updates.push({ sql, args }); return { success: true }; },
                all: async <T>() => ({ results: [] as T[] }),
            }),
        }),
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res = await examsMod.updateExamWithContext(ctx as any, 1, { title: 'new', randomize: true, is_public: false });
    t.equal(res.status, 200);
});

test('GET /api/exams/[id]/assignments lists assignments', async (t) => {
    t.plan(2);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id FROM exams WHERE id = ?')) return { author_id: 10 } as unknown as T;
                    return null as unknown as T;
                },
                all: async <T>() => {
                    if (sql.includes('FROM exam_assignments')) {
                        return { results: [{ id: 1, exam_id: 1, user_id: 100 }] } as any;
                    }
                    return { results: [] as T[] } as any;
                },
                run: async () => ({ success: true })
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res = await assignmentsMod.listAssignmentsWithContext(ctx as any, 1);
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.data.assignments.length, 1);
});


