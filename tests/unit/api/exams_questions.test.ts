import test from 'tape';
import * as mod from '../../../app/api/exams/[id]/questions/route';

test('GET /api/exams/[id]/questions author listing', async (t) => {
    t.plan(2);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id FROM exams WHERE id = ?')) {
                        return { author_id: 10 } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => {
                    if (sql.includes('FROM exam_questions')) {
                        return {
                            results: [
                                { exam_question_id: 1, order_index: 1, points: 2, question_id: 11, type: 'single_choice', schema_version: 1, content_json: JSON.stringify({}), rubric_json: JSON.stringify({}) },
                            ],
                        } as any;
                    }
                    return { results: [] as T[] } as any;
                },
            }),
        }),
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res = await mod.listExamQuestionsWithContext(ctx as any, 1);
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.data.items.length, 1);
});


