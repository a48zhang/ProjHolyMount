'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PublicExamDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const examId = Number(id);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!Number.isFinite(examId)) { router.push('/exams?list=public'); return; }
        fetch(`/api/public/exams/${examId}`)
            .then(r => r.json() as Promise<any>)
            .then(res => { if (res.success) setData(res.data); else setError(res.error || '获取失败'); })
            .catch(() => setError('网络错误'))
            .finally(() => setLoading(false));
    }, [examId, router]);

    if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6">加载中...</div>;
    if (error) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 text-red-600">{error}</div>;
    if (!data) return null;

    return (
        <div className="container-page">
            <div className="container-inner max-w-3xl space-y-4">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">{data.title}</h1>
                    <div className="text-sm muted mb-2">{data.description || '无描述'}</div>
                    <div className="text-sm muted">总分 {data.total_points} · {data.duration_minutes ? `${data.duration_minutes} 分钟` : '不限时'} · 题目数 {data.question_count}</div>
                </div></div>
                <div className="flex items-center gap-2">
                    <Link href="/" className="btn btn-ghost">返回</Link>
                    <Link href={`/exams?list=public`} className="btn btn-ghost">公开列表</Link>
                </div>
            </div>
        </div>
    );
}


