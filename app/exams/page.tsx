'use client';

import { Suspense, useEffect, useState } from 'react';
import { Button, Space, Tag } from 'antd';
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
        <Suspense fallback={<div className="container-page"><div className="container-inner">加载中...</div></div>}>
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
                    <Space size="small">
                        <Button type={isPublic ? 'default' : 'primary'} onClick={() => router.push('/exams')}>我的考试</Button>
                        <Button type={isPublic ? 'primary' : 'default'} onClick={() => router.push('/exams?list=public')}>公开考试</Button>
                    </Space>
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
                                <Space size="small">
                                    <Tag color={e.status === 'published' ? 'blue' : e.status === 'closed' ? 'red' : 'default'}>
                                        {e.status === 'published' ? '已发布' : e.status === 'closed' ? '已关闭' : '草稿'}
                                    </Tag>
                                    {e.status === 'published' ? (
                                        <Button type="primary" onClick={() => router.push(`/exams/${e.id}/take`)}>进入</Button>
                                    ) : (
                                        <span className="text-sm muted">未开始</span>
                                    )}
                                </Space>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

