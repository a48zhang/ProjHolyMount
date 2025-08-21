'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, InputNumber, Input, Button, Space, message } from 'antd';

export default function GradeSubmissionPage() {
    const { id } = useParams<{ id: string }>();
    const submissionId = Number(id);
    const router = useRouter();
    const [detail, setDetail] = useState<any>(null);
    const [scores, setScores] = useState<Record<number, number>>({});
    const [feedback, setFeedback] = useState('');
    const [paper, setPaper] = useState<any[] | null>(null);
    const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''), []);

    useEffect(() => {
        if (!token || !Number.isFinite(submissionId)) { router.push('/'); return; }
        (async () => {
            const r = await fetch(`/api/submissions/${submissionId}`, { headers: { Authorization: `Bearer ${token}` } });
            const res: any = await r.json();
            if (res.success) {
                setDetail(res.data);
                const initial: Record<number, number> = {};
                (res.data.answers || []).forEach((a: any) => { initial[a.exam_question_id] = a.score || 0; });
                setScores(initial);
                const examId = res?.data?.submission?.exam_id;
                if (examId) {
                    try {
                        const pr = await fetch(`/api/exams/${examId}/paper?includeAnswers=true`, { headers: { Authorization: `Bearer ${token}` } });
                        const pj: any = await pr.json();
                        if (pj?.success) setPaper(pj.data?.items || []);
                    } catch { }
                }
            } else {
                message.error(res.error || '加载失败');
            }
        })();
    }, [submissionId, token, router]);

    const submit = async () => {
        if (!token) return message.error('未登录');
        const items = Object.entries(scores).map(([k, v]) => ({ exam_question_id: Number(k), score: Number(v) }));
        const res = await fetch(`/api/submissions/${submissionId}/score`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ items, feedback }) });
        const json: any = await res.json();
        if (json.success) { message.success('已提交评分'); router.back(); } else { message.error(json.error || '评分失败'); }
    };

    if (!detail) return <div className="container-page"><div className="container-inner">加载中...</div></div>;
    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl space-y-4">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">提交 #{submissionId} 评分</h1>
                    <Space direction="vertical" className="w-full">
                        {(detail.answers || []).map((a: any, idx: number) => {
                            const examItem = (paper || []).find((it: any) => it.exam_question_id === a.exam_question_id);
                            const q = examItem?.question;
                            return (
                                <div key={a.exam_question_id} className="border rounded p-3">
                                    <div className="text-sm muted mb-2">题目 {idx + 1}</div>
                                    {q && (
                                        <div className="mb-2">
                                            <div className="font-medium mb-1">题干：</div>
                                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{JSON.stringify(q.content, null, 2)}</pre>
                                            {'answer_key' in q && q.answer_key !== undefined && (
                                                <>
                                                    <div className="font-medium mt-2">标准答案：</div>
                                                    <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{JSON.stringify(q.answer_key, null, 2)}</pre>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <div className="text-sm muted mb-2">作答：</div>
                                    <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto">{JSON.stringify(a.answer_json, null, 2)}</pre>
                                    <div className="mt-2">得分：<InputNumber min={0} value={scores[a.exam_question_id]} onChange={(v) => setScores(s => ({ ...s, [a.exam_question_id]: Number(v) }))} /></div>
                                </div>
                            );
                        })}
                        <Input.TextArea rows={3} placeholder="评语（可选）" value={feedback} onChange={e => setFeedback(e.target.value)} />
                        <Button type="primary" onClick={submit}>提交评分</Button>
                    </Space>
                </div></div>
            </div>
        </div>
    );
}


