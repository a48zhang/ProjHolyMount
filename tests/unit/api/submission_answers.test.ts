import test from 'tape';
import { saveAnswersWithContext } from '../../../lib/exam-services';

test('PUT /api/submissions/[id]/answers saves answers list', async (t) => {
    t.plan(2);

    const saved: any[] = [];
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (...args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM submissions WHERE id = ?')) {
                        return { exam_id: 1, user_id: 42, status: 'in_progress' } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => {
                    saved.push({ sql, args });
                    return { success: true };
                },
            }),
        }),
    };

    const ctx = { env: { DB: dbStub }, userId: 42, username: 'u', email: 'e', role: 'student', plan: 'free', grade_level: null };
    const res: Response = await saveAnswersWithContext(
        ctx as any,
        10,
        [{ exam_question_id: 7, answer_json: 'A' }, { exam_question_id: 8, answer_json: ['B', 'C'] }]
    );
    const json = await res.json();
    t.equal(res.status, 200, 'should return 200');
    t.equal(json.data.saved, 2, 'saved count equals items length');
});


