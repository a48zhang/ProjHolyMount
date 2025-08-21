import test from 'tape';
import * as mod from '../../../app/api/questions/[id]/route';

function buildCtx(role: 'teacher' | 'admin', userId = 10) {
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('SELECT * FROM questions WHERE id = ?')) {
                        return { id: 1, author_id: userId, content_json: '{}', answer_key_json: '"A"', rubric_json: '{}' } as unknown as T;
                    }
                    if (sql.includes('SELECT author_id FROM questions WHERE id = ?')) {
                        return { author_id: userId } as unknown as T;
                    }
                    return null as unknown as T;
                },
                run: async () => ({ success: true }),
                all: async <T>() => ({ results: [] as T[] }),
            })
        })
    };
    return { env: { DB: dbStub }, userId, username: 't', email: 'x', role, plan: 'free', grade_level: null } as any;
}

test.skip('GET /api/questions/[id] returns question for owner', async (_t) => { });

test.skip('PATCH /api/questions/[id] updates content for owner', async (_t) => { });

test.skip('DELETE /api/questions/[id] soft deletes for owner', async (_t) => { });


