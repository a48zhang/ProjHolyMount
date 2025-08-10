'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface ExamItem {
    id: number;
    title: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
    duration_minutes: number | null;
    total_points: number;
}

export default function ExamsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6">加载中...</div>}>
            <ExamsPageInner />
        </Suspense>
    );
}

function ExamsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPublic = (searchParams.get('list') || '').toLowerCase() === 'public';
    const [items, setItems] = useState<ExamItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        const url = isPublic ? '/api/exams?list=public' : '/api/exams';
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then((res: any) => {
                if (res.success) setItems(res.data || []);
                else setError(res.error || '获取考试失败');
            })
            .catch(() => setError('网络错误'))
            .finally(() => setLoading(false));
    }, [router, isPublic]);

    if (loading) return <div className="container-page"><div className="container-inner">加载中...</div></div>;
    if (error) return <div className="container-page"><div className="container-inner text-red-600">{error}</div></div>;

    return (
        <div className="container-page">
            <div className="container-inner">
                <div className="flex items-center justify-between mb-4">
                    <h1>{isPublic ? '公开考试' : '我的考试'}</h1>
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/exams" className={`btn ${!isPublic ? 'btn-primary' : 'btn-ghost'}`}>我的考试</Link>
                        <Link href="/exams?list=public" className={`btn ${isPublic ? 'btn-primary' : 'btn-ghost'}`}>公开考试</Link>
                    </div>
                </div>
                <div className="space-y-4">
                    {items.map((e) => (
                        <div key={e.id} className="card p-0">
                            <div className="card-body flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-lg">{e.title}</div>
                                    <div className="text-sm muted mt-1">
                                        总分 {e.total_points} · {e.duration_minutes ? `${e.duration_minutes} 分钟` : '不限时'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`chip ${e.status === 'published' ? 'chip-info' : e.status === 'closed' ? 'chip-warn' : 'chip-muted'}`}>{e.status}</span>
                                    {e.status === 'published' ? (
                                        <Link href={`/exams/${e.id}/take`} className="btn btn-primary">
                                            进入
                                        </Link>
                                    ) : (
                                        <span className="text-sm muted">未开始</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

