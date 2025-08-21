import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import type { AuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

export async function listAssignmentsWithContext(ctx: AuthContext, examId: number) {
    try {
        if (!Number.isFinite(examId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
        const own = await ctx.env.DB.prepare('SELECT author_id FROM exams WHERE id = ?').bind(examId).first<{ author_id: number }>();
        if (!own) return NextResponse.json({ success: false, error: '试卷不存在' }, { status: 404 });
        if (own.author_id !== ctx.userId && ctx.role !== 'admin') return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });
        const rows = await ctx.env.DB
            .prepare('SELECT id, exam_id, user_id, assigned_at, due_at FROM exam_assignments WHERE exam_id = ? ORDER BY id DESC')
            .bind(examId)
            .all<any>();
        return NextResponse.json({ success: true, data: { assignments: rows.results || [] } });
    } catch (error) {
        console.error('获取试卷分配列表错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}

export const GET = withApiLogging(async (request: Request) => {
    const ctx = await getAuthContext(request);
    const pathname = new URL(request.url).pathname;
    const parts = pathname.split('/');
    const idx = parts.findIndex(p => p === 'exams');
    const examId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
    return listAssignmentsWithContext(ctx, examId);
});




