import test from 'tape';
import * as mod from '../../../app/api/exams/[id]/questions/bulk/route';

test('POST /api/exams/[id]/questions/bulk sets items and total points', async (t) => {
    t.plan(2);
    const inserts: any[] = [];
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (...args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id, status FROM exams WHERE id = ?')) {
                        return { author_id: 10, status: 'draft' } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => { inserts.push({ sql, args }); return { success: true }; },
            }),
        }),
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res = await mod.setExamQuestionsWithContext(ctx as any, 1, [
        { question_id: 11, order_index: 1, points: 2 },
        { question_id: 12, order_index: 2, points: 3 },
    ]);
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.data.total_points, 5);
});


