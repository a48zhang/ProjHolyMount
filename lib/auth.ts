import { getCloudflareContext } from '@opennextjs/cloudflare';
import jwt from 'jsonwebtoken';

type BasicToken = {
    userId: number;
    username: string;
    email: string;
};

export interface AuthContext {
    env: CloudflareEnv;
    userId: number;
    username: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    plan: string; // free | premium
    grade_level: string | null;
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
    const { env } = await getCloudflareContext();

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) throw new Error('UNAUTHORIZED');

    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) throw new Error('SERVER_CONFIG');

    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & BasicToken;

    // 读取角色
    const roleRow = await env.DB
        .prepare('SELECT role FROM user_roles WHERE user_id = ?')
        .bind(decoded.userId)
        .first<{ role: 'student' | 'teacher' | 'admin' }>();

    // 读取权益档案
    const profileRow = await env.DB
        .prepare('SELECT plan, grade_level FROM user_profile WHERE user_id = ?')
        .bind(decoded.userId)
        .first<{ plan: string; grade_level: string | null }>();

    return {
        env,
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: roleRow?.role ?? 'student',
        plan: profileRow?.plan ?? 'free',
        grade_level: profileRow?.grade_level ?? null,
    };
}

export function requireRole(ctx: AuthContext, allowed: Array<'student' | 'teacher' | 'admin'> | 'teacher' | 'admin' | 'student') {
    const allowList = Array.isArray(allowed) ? allowed : [allowed];
    if (!allowList.includes(ctx.role)) throw new Error('FORBIDDEN');
}

export function ensurePlan(ctx: AuthContext, requiredPlan: string | null | undefined) {
    if (!requiredPlan) return;
    if ((ctx.plan || 'free') !== requiredPlan) throw new Error('PAYMENT_REQUIRED');
}

export function ensureGrade(ctx: AuthContext, requiredGrade: string | null | undefined) {
    if (!requiredGrade) return;
    if ((ctx.grade_level || '') !== requiredGrade) throw new Error('FORBIDDEN_GRADE');
}

export async function requireExamAuthor(ctx: AuthContext, examId: number) {
    const exam = await ctx.env.DB
        .prepare('SELECT author_id FROM exams WHERE id = ?')
        .bind(examId)
        .first<{ author_id: number }>();
    if (!exam) throw new Error('NOT_FOUND');
    if (exam.author_id !== ctx.userId && ctx.role !== 'admin') throw new Error('FORBIDDEN');
}

export async function requireAssigned(ctx: AuthContext, examId: number) {
    const row = await ctx.env.DB
        .prepare('SELECT id FROM exam_assignments WHERE exam_id = ? AND user_id = ?')
        .bind(examId, ctx.userId)
        .first<{ id: number }>();
    if (!row) throw new Error('FORBIDDEN');
}

