import test from 'tape';
import * as mod from '../../../app/api/exams/[id]/paper/route';

test('GET /api/exams/[id]/paper returns items (author view, include answers)', async (t) => {
    t.plan(3);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT author_id FROM exams WHERE id = ?')) {
                        return { author_id: 10 } as unknown as T;
                    }
                    if (sql.includes('SELECT randomize FROM exams WHERE id = ?')) {
                        return { randomize: 0 } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => {
                    if (sql.includes('FROM exam_questions eq JOIN questions q')) {
                        return {
                            results: [
                                { exam_question_id: 1, points: 2, question_id: 11, type: 'single_choice', schema_version: 1, content_json: JSON.stringify({}), answer_key_json: JSON.stringify('A') },
                            ],
                        } as any;
                    }
                    return { results: [] as T[] } as any;
                },
            }),
        }),
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null };
    const res = await mod.getExamPaperWithContext(ctx as any, 1, true);
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.success, true);
    t.equal(json.data.items[0].question.answer_key, 'A');
});


