import test from 'tape';
import * as statusMod from '../../../app/api/submissions/[id]/status/route';
import * as detailMod from '../../../app/api/submissions/[id]/route';

test.skip('GET /api/submissions/[id]/status author can view', async (t) => {
    t.plan(2);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM submissions s JOIN exams e')) {
                        return { status: 'in_progress', deadline_at: null, user_id: 2, author_id: 10 } as unknown as T;
                    }
                    return null as unknown as T;
                }
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null } as any;
    const req = new Request('https://example.com/api/submissions/1/status', { headers: { Authorization: 'Bearer x' } } as any);
    const res = await statusMod.GET(req);
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.success, true);
});

test.skip('GET /api/submissions/[id] detail returns answers array', async (t) => {
    t.plan(2);
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM submissions s JOIN exams e')) return { id: 1, exam_id: 1, user_id: 2, author_id: 10 } as unknown as T;
                    return null as unknown as T;
                },
                all: async <T>() => {
                    if (sql.includes('FROM submission_answers')) return { results: [{ exam_question_id: 1, answer_json: '"A"', score: 1, is_auto_scored: 1 }] } as any;
                    return { results: [] as T[] } as any;
                }
            })
        })
    };
    const ctx = { env: { DB: dbStub }, userId: 10, username: 't', email: 'x', role: 'teacher', plan: 'free', grade_level: null } as any;
    const res = await detailMod.GET(new Request('https://example.com/api/submissions/1', { headers: { Authorization: 'Bearer x' } } as any));
    t.equal(res.status, 200);
    const json = await res.json();
    t.equal(json.data.answers.length, 1);
});


