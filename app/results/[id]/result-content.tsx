'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/page-header';

export default function ResultContent() {
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

    if (loading) return <div className="container-page"><div className="container-inner"><div className="card"><div className="card-body">加载中...</div></div></div></div>;
    if (error) return <div className="container-page"><div className="container-inner text-red-600">{error}</div></div>;
    if (!data) return null;

    const sub = data.submission;
    const answers = data.answers as Array<{ exam_question_id: number; answer_json: any; score: number; is_auto_scored: number; }>
    const paper: Array<{ exam_question_id: number; points: number; question: any }> = data.paper || [];
    const answerMap = useMemo(() => new Map(answers.map((a: any) => [a.exam_question_id, a])), [answers]);

    return (
        <div className="container-page">
            <PageHeader title={`成绩 #${submissionId}`} />
            <div className="container-inner max-w-4xl space-y-4">
                <div className="card">
                    <div className="card-body">
                        <h2 className="card-title">成绩</h2>
                        <div>总分：{sub.score_total}（自动：{sub.score_auto}，人工：{sub.score_manual}）</div>
                        <div className="mt-2">
                            状态：
                            <span className={`chip ml-1 ${sub.status === 'graded' ? 'chip-info' : sub.status === 'submitted' ? 'chip-info' : 'chip-muted'}`}>
                                {sub.status === 'graded' ? '已评分' : sub.status === 'submitted' ? '已提交' : '进行中'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-body space-y-3">
                        <h2 className="card-title">题目与答案</h2>
                        {paper.map((it: any, idx: number) => {
                            const a = answerMap.get(it.exam_question_id);
                            const q = it.question;
                            return (
                                <div key={it.exam_question_id} className="border rounded p-3 space-y-2">
                                    <div className="text-sm muted">第 {idx + 1} 题 · {q.type} · {it.points} 分 · 得分 {a?.score ?? 0} {a?.is_auto_scored ? '(自动)' : '(人工)'}
                                    </div>
                                    <QuestionBlock q={q} answer={a?.answer_json} answerKey={q.answer_key} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestionBlock({ q, answer, answerKey }: { q: any; answer: any; answerKey: any }) {
    if (q.type === 'single_choice') {
        const options: string[] = q.content?.options || [];
        return (
            <div className="space-y-1">
                <div>{q.content?.stem}</div>
                <div className="text-sm">我的答案：{String(answer)}</div>
                <div className="text-sm">参考答案：{String(answerKey)}</div>
                <ul className="list-disc pl-6">
                    {options.map((op: string, i: number) => (
                        <li key={i}>{i}. {op}</li>
                    ))}
                </ul>
            </div>
        );
    }
    if (q.type === 'multiple_choice') {
        const options: string[] = q.content?.options || [];
        return (
            <div className="space-y-1">
                <div>{q.content?.stem}</div>
                <div className="text-sm">我的答案：{Array.isArray(answer) ? answer.join(', ') : ''}</div>
                <div className="text-sm">参考答案：{Array.isArray(answerKey) ? answerKey.join(', ') : ''}</div>
                <ul className="list-disc pl-6">
                    {options.map((op: string, i: number) => (
                        <li key={i}>{i}. {op}</li>
                    ))}
                </ul>
            </div>
        );
    }
    if (q.type === 'fill_blank') {
        return (
            <div className="space-y-1">
                <div>{q.content?.text}</div>
                <div className="text-sm">我的答案：{Array.isArray(answer) ? answer.join(' | ') : ''}</div>
                <div className="text-sm">参考答案：{Array.isArray(answerKey) ? answerKey.join(' | ') : ''}</div>
            </div>
        );
    }
    if (q.type === 'short_answer' || q.type === 'essay') {
        return (
            <div className="space-y-1">
                <div>{q.content?.prompt}</div>
                <div className="text-sm">我的答案：</div>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{String(answer ?? '')}</pre>
                <div className="text-sm">参考答案：</div>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{String(answerKey ?? '')}</pre>
            </div>
        );
    }
    return <div>暂不支持的题型：{q.type}</div>;
}