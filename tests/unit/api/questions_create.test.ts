import test from 'tape';
import { createQuestionWithContext } from '../../../lib/exam-services';

test('POST /api/questions creates a question by teacher', async (t) => {
    t.plan(3);

    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                run: async () => ({ success: true, meta: { last_row_id: 321 } }),
                first: async <T>() => {
                    if (sql.includes('SELECT id FROM questions WHERE author_id = ? ORDER BY id DESC LIMIT 1')) {
                        return { id: 321 } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
            }),
        }),
    };

    const ctx = { env: { DB: dbStub }, userId: 2, username: 't', email: 't@x', role: 'teacher', plan: 'free', grade_level: null };
    const body = { type: 'single_choice', content_json: { stem: 'x', options: ['A', 'B'] }, answer_key_json: 'A', rubric_json: null };
    // 直接调用注入上下文的纯函数
    const res: Response = await createQuestionWithContext(ctx as any, body);
    t.equal(res.status, 200, 'should return 200');
    const json = await res.json();
    t.equal(json.success, true, 'success true');
    t.equal(json.data.id, 321, 'returns created id');
});


