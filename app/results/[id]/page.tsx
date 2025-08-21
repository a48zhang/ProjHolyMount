'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResultPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const submissionId = Number(id);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(submissionId)) {
            router.push('/');
            return;
        }
        fetch(`/api/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then((res: any) => {
                if (res.success) setData(res.data);
                else setError(res.error || '获取成绩失败');
            })
            .catch(() => setError('网络错误'))
            .finally(() => setLoading(false));
    }, [router, submissionId]);

    if (loading) return <div className="container-page"><div className="container-inner">加载中...</div></div>;
    if (error) return <div className="container-page"><div className="container-inner text-red-600">{error}</div></div>;
    if (!data) return null;

    const sub = data.submission;
    const answers = data.answers as Array<{ exam_question_id: number; score: number; is_auto_scored: number; }>
    const correctCount = answers.filter(a => a.score > 0).length;

    return (
        <div className="container-page">
            <div className="container-inner max-w-3xl space-y-4">
                <div className="card">
                    <div className="card-body">
                        <h2 className="card-title">成绩</h2>
                        <div>总分：{sub.score_total}（自动：{sub.score_auto}，人工：{sub.score_manual}）</div>
                        <div className="mt-1">对题数：{correctCount} / {(answers || []).length}</div>
                        <div className="mt-2">
                            状态：
                            <span className={`chip ml-1 ${sub.status === 'graded' ? 'chip-info' : sub.status === 'submitted' ? 'chip-info' : 'chip-muted'}`}>
                                {sub.status === 'graded' ? '已评分' : sub.status === 'submitted' ? '已提交' : '进行中'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body">
                        <h2 className="card-title">各题得分</h2>
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {answers.map((a) => (
                                <li key={a.exam_question_id} className="py-2 text-sm">
                                    题目 {a.exam_question_id} · 得分 {a.score} {a.is_auto_scored ? '(自动)' : '(人工)'}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="text-right">
                    <button className="btn" onClick={() => window.location.href = '/exams'}>返回我的考试</button>
                </div>
            </div>
        </div>
    );
}

