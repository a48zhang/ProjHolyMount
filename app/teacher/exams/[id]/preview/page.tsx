'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PreviewExamAsStudent() {
    const { id } = useParams<{ id: string }>();
    const examId = Number(id);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(examId)) { setError('参数错误或未登录'); setLoading(false); return; }
        fetch(`/api/exams/${examId}/paper`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => {
                if (res.success) setItems(res.data.items || []); else setError(res.error || '加载失败');
            })
            .catch(() => setError('网络错误'))
            .finally(() => setLoading(false));
    }, [examId]);

    if (loading) return <div className="container-page"><div className="container-inner">加载中...</div></div>;
    if (error) return <div className="container-page"><div className="container-inner text-red-600">{error}</div></div>;

    return (
        <div className="container-page">
            <div className="container-inner max-w-3xl space-y-3">
                <h1 className="card-title">学生视图预览 #{examId}</h1>
                {items.map((it, idx) => (
                    <div key={it.exam_question_id} className="card">
                        <div className="card-body">
                            <div className="text-sm muted mb-3">第 {idx + 1} 题 · {it.points} 分 · {it.question?.type}</div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{JSON.stringify(it.question?.content, null, 2)}</pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


