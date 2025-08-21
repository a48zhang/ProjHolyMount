'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Space } from 'antd';

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

    if (loading) return <div className="container-page"><div className="container-inner">加载中...</div></div>;
    if (error) return <div className="container-page"><div className="container-inner text-red-600">{error}</div></div>;
    if (!data) return null;

    return (
        <div className="container-page">
            <div className="container-inner max-w-3xl space-y-4">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">{data.title}</h1>
                    <div className="text-sm muted mb-2">{data.description || '无描述'}</div>
                    <div className="text-sm muted">总分 {data.total_points} · {data.duration_minutes ? `${data.duration_minutes} 分钟` : '不限时'} · 题目数 {data.question_count}</div>
                </div></div>
                <Space>
                    <Button onClick={() => router.push('/exams?list=public')}>返回列表</Button>
                    <Button type="primary" onClick={() => {
                        const token = localStorage.getItem('token');
                        if (!token) {
                            router.push('/');
                            return;
                        }
                        router.push(`/exams/${examId}/take`);
                    }}>登录后参加</Button>
                </Space>
            </div>
        </div>
    );
}


