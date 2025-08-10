import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext(request);
        const pathname = new URL(request.url).pathname;
        const parts = pathname.split('/');
        const idx = parts.findIndex(p => p === 'submissions');
        const submissionId = idx >= 0 && parts[idx + 1] ? Number(parts[idx + 1]) : NaN;
        if (!Number.isFinite(submissionId)) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });

        const sub = await ctx.env.DB
            .prepare('SELECT s.status, s.deadline_at, s.user_id, e.author_id FROM submissions s JOIN exams e ON e.id = s.exam_id WHERE s.id = ?')
            .bind(submissionId)
            .first<{ status: string; deadline_at: string | null; user_id: number; author_id: number }>();
        if (!sub) return NextResponse.json({ success: false, error: '提交不存在' }, { status: 404 });
        const can = ctx.userId === sub.user_id || (ctx.role !== 'student' && ctx.userId === sub.author_id) || ctx.role === 'admin';
        if (!can) return NextResponse.json({ success: false, error: '无权访问' }, { status: 403 });

        return NextResponse.json({ success: true, data: { status: sub.status, deadline_at: sub.deadline_at, now: new Date().toISOString() } });
    } catch (error) {
        console.error('获取提交状态错误:', error);
        return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
    }
}




