import test from 'tape';
import * as mod from '../../../app/api/submissions/[id]/submit/route';

test('POST /api/submissions/[id]/submit calculates auto score and updates rows', async (t) => {
    t.plan(3);

    const updates: any[] = [];
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (...args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM submissions WHERE id = ?')) {
                        return { exam_id: 1, user_id: 10, status: 'in_progress' } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => {
                    if (sql.includes('FROM exam_questions eq JOIN questions q')) {
                        return {
                            results: [
                                { exam_question_id: 1, question_id: 11, type: 'single_choice', schema_version: 1, answer_key_json: JSON.stringify('A'), points: 2 },
                                { exam_question_id: 2, question_id: 12, type: 'multiple_choice', schema_version: 1, answer_key_json: JSON.stringify(['B', 'C']), points: 3 },
                            ],
                        } as any;
                    }
                    if (sql.includes('FROM submission_answers WHERE submission_id = ?')) {
                        return {
                            results: [
                                { exam_question_id: 1, answer_json: JSON.stringify('A') },
                                { exam_question_id: 2, answer_json: JSON.stringify(['C', 'B']) },
                            ],
                        } as any;
                    }
                    return { results: [] as T[] } as any;
                },
                run: async () => {
                    updates.push({ sql, args });
                    return { success: true };
                },
            }),
        }),
    };

    const ctx = { env: { DB: dbStub }, userId: 10, username: 'u', email: 'e', role: 'student', plan: 'free', grade_level: null };
    const res: Response = await mod.submitWithContext(ctx as any, 5);
    t.equal(res.status, 200, 'should return 200');
    const json = await res.json();
    t.equal(json.success, true, 'success true');
    t.equal(json.data.score_auto, 5, 'auto score should be 5');
});


