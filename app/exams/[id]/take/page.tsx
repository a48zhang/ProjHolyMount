'use client';

import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useParams, useRouter } from 'next/navigation';

type PaperItem = {
    exam_question_id: number;
    points: number;
    question: {
        id: number;
        type: string;
        schema_version: number;
        content: any;
    };
};

export default function TakeExamPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const examId = Number(params.id);
    const [paper, setPaper] = useState<PaperItem[]>([]);
    const [submissionId, setSubmissionId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 自动保存节流
    useEffect(() => {
        const tid = setInterval(() => {
            const token = localStorage.getItem('token');
            if (!token || !submissionId) return;
            const items = Object.entries(answers).map(([exam_question_id, answer_json]) => ({ exam_question_id: Number(exam_question_id), answer_json }));
            if (items.length === 0) return;
            fetch(`/api/submissions/${submissionId}/answers`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ items })
            });
        }, 2500);
        return () => clearInterval(tid);
    }, [answers, submissionId]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(examId)) {
            router.push('/');
            return;
        }
        (async () => {
            try {
                // 开始考试（或继续）
                const startRes = await fetch(`/api/exams/${examId}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                const start: any = await startRes.json();
                if (!start.success) throw new Error(start.error || '无法开始考试');
                setSubmissionId(start.data.submission_id);

                // 拉取试卷（不含答案）
                const paperRes = await fetch(`/api/exams/${examId}/paper`, { headers: { Authorization: `Bearer ${token}` } });
                const paperJson: any = await paperRes.json();
                if (!paperJson.success) throw new Error(paperJson.error || '无法获取试卷');
                setPaper(paperJson.data.items || []);
                setLoading(false);
            } catch (e: any) {
                setError(e.message || '加载失败');
                setLoading(false);
            }
        })();
    }, [examId, router]);

    const handleChange = (eqid: number, value: any) => {
        setAnswers(prev => ({ ...prev, [eqid]: value }));
    };

    const submit = async () => {
        const token = localStorage.getItem('token');
        if (!token || !submissionId) return;
        // 最后一轮保存
        const items = Object.entries(answers).map(([exam_question_id, answer_json]) => ({ exam_question_id: Number(exam_question_id), answer_json }));
        if (items.length) {
            await fetch(`/api/submissions/${submissionId}/answers`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ items }) });
        }
        // 提交判分
        const res = await fetch(`/api/submissions/${submissionId}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const json: any = await res.json();
        if (json.success) { router.push(`/results/${submissionId}`); }
        else { message.error(json.error || '提交失败'); }
    };

    if (loading) return <div className="p-6">加载中...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;

    return (
        <div className="container-page">
            <div className="container-inner space-y-4 max-w-3xl">
                <h1>考试 #{examId}</h1>
                <div className="space-y-4">
                    {paper.map((it, idx) => (
                        <div key={it.exam_question_id} className="card">
                            <div className="card-body">
                                <div className="text-sm muted mb-3">第 {idx + 1} 题 · {it.points} 分 · {it.question.type}</div>
                                <QuestionEditor item={it} value={answers[it.exam_question_id]} onChange={(v) => handleChange(it.exam_question_id, v)} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-2">
                    <button onClick={submit} className="btn btn-primary">提交试卷</button>
                </div>
            </div>
        </div>
    );
}

function QuestionEditor({ item, value, onChange }: { item: PaperItem; value: any; onChange: (v: any) => void }) {
    const q = item.question;
    if (q.type === 'single_choice') {
        const options: string[] = q.content?.options || [];
        return (
            <div className="space-y-2">
                <div>{q.content?.stem}</div>
                <div className="space-y-1">
                    {options.map((op: string, i: number) => (
                        <label key={i} className="block">
                            <input type="radio" name={`q-${item.exam_question_id}`} checked={value === i} onChange={() => onChange(i)} /> {op}
                        </label>
                    ))}
                </div>
            </div>
        );
    }
    if (q.type === 'multiple_choice') {
        const options: string[] = q.content?.options || [];
        const cur: number[] = Array.isArray(value) ? value : [];
        const toggle = (i: number) => {
            const set = new Set(cur);
            if (set.has(i)) set.delete(i); else set.add(i);
            onChange(Array.from(set).sort((a, b) => a - b));
        };
        return (
            <div className="space-y-2">
                <div>{q.content?.stem}</div>
                <div className="space-y-1">
                    {options.map((op: string, i: number) => (
                        <label key={i} className="block">
                            <input type="checkbox" checked={cur.includes(i)} onChange={() => toggle(i)} /> {op}
                        </label>
                    ))}
                </div>
            </div>
        );
    }
    if (q.type === 'fill_blank') {
        const blanks: number = q.content?.blanks?.length || 0;
        const cur: string[] = Array.isArray(value) ? value : Array.from({ length: blanks }, () => '');
        const setIdx = (i: number, v: string) => {
            const cp = [...cur];
            cp[i] = v;
            onChange(cp);
        };
        return (
            <div className="space-y-2">
                <div>{q.content?.text}</div>
                <div className="space-y-1">
                    {Array.from({ length: blanks }).map((_, i) => (
                        <input key={i} className="input" value={cur[i] || ''} onChange={(e) => setIdx(i, e.target.value)} placeholder={`填空 ${i + 1}`} />
                    ))}
                </div>
            </div>
        );
    }
    if (q.type === 'short_answer' || q.type === 'essay') {
        return (
            <div className="space-y-2">
                <div>{q.content?.prompt}</div>
                <textarea className="input min-h-28" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="请输入答案" />
            </div>
        );
    }
    return <div>暂不支持的题型：{q.type}</div>;
}

