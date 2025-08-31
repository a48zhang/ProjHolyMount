import test from 'tape';
import { startExamWithContext } from '../../../lib/exam-services';

test('POST /api/exams/[id]/start creates submission when none exists', async (t) => {
    t.plan(3);

    const calls: any[] = [];
    const dbStub = {
        prepare: (sql: string) => ({
            bind: (...args: any[]) => ({
                first: async <T>() => {
                    // exam row
                    if (sql.includes('FROM exams WHERE id = ?')) {
                        return {
                            status: 'published',
                            start_at: null,
                            end_at: null,
                            duration_minutes: null,
                            required_plan: null,
                            required_grade_level: null,
                        } as unknown as T;
                    }
                    // assigned check
                    if (sql.includes('FROM exam_assignments')) {
                        return { id: 1 } as unknown as T;
                    }
                    // existing submission check
                    if (sql.includes('SELECT id, status FROM submissions WHERE exam_id = ? AND user_id = ?')) {
                        return null as unknown as T;
                    }
                    // return created id
                    if (sql.includes('SELECT id FROM submissions WHERE exam_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1')) {
                        return { id: 100 } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => {
                    calls.push({ sql, args });
                    return { success: true, meta: { last_row_id: 100 } };
                },
            }),
        }),
    };

    const ctx = {
        env: { DB: dbStub },
        userId: 1,
        username: 'u',
        email: 'e',
        role: 'student',
        plan: 'free',
        grade_level: null,
    };

    // 直接调用注入上下文的纯函数

    const req = new Request('https://example.com/api/exams/1/start', {
        method: 'POST',
        headers: { Authorization: 'Bearer token' },
    });
    const res: Response = await startExamWithContext(ctx as any, 1);
    t.equal(res.status, 200, 'should return 200');
    const json = await res.json();
    t.equal(json.success, true, 'success true');
    t.equal(json.data.submission_id, 100, 'returns created submission id');
});

test('POST /api/exams/[id]/start returns existing submission id', async (t) => {
    t.plan(2);

    const dbStub = {
        prepare: (sql: string) => ({
            bind: (..._args: any[]) => ({
                first: async <T>() => {
                    if (sql.includes('FROM exams WHERE id = ?')) {
                        return {
                            status: 'published', start_at: null, end_at: null, duration_minutes: null, required_plan: null, required_grade_level: null,
                        } as unknown as T;
                    }
                    if (sql.includes('FROM exam_assignments')) {
                        return { id: 1 } as unknown as T;
                    }
                    if (sql.includes('SELECT id, status FROM submissions WHERE exam_id = ? AND user_id = ?')) {
                        return { id: 55, status: 'in_progress' } as unknown as T;
                    }
                    return null as unknown as T;
                },
                all: async <T>() => ({ results: [] as T[] }),
                run: async () => ({ success: true }),
            }),
        }),
    };

    const ctx = { env: { DB: dbStub }, userId: 1, username: 'u', email: 'e', role: 'student', plan: 'free', grade_level: null };


    const req = new Request('https://example.com/api/exams/99/start', { method: 'POST', headers: { Authorization: 'Bearer token' } });
    const res: Response = await startExamWithContext(ctx as any, 99);
    const json = await res.json();
    t.equal(res.status, 200, 'should return 200');
    t.equal(json.data.submission_id, 55, 'returns existing submission id');
});


