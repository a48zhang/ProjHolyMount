'use client';

import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import PageHeader from '@/components/page-header';
import EmptyState from '@/components/empty-state';

type PracticeItem = {
    question_id: number;
    type: string;
    schema_version: number;
    content: any;
};

export default function PracticePage() {
    const [items, setItems] = useState<PracticeItem[]>([]);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<null | {
        results: Array<{ question_id: number; correct: boolean; score_unit: number; answer_key: any }>;
        correct_count: number;
        total: number;
    }>(null);
    const [lastParams, setLastParams] = useState<{ count: number; type?: string | null }>({ count: 10 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        (async () => {
            try {
                const qs = new URLSearchParams();
                qs.set('count', String(lastParams.count || 10));
                if (lastParams.type) qs.set('type', lastParams.type);
                const r = await fetch(`/api/practice/paper?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
                const j: any = await r.json();
                if (!j.success) throw new Error(j.error || '获取失败');
                setItems(j.data.items || []);
            } catch (e: any) {
                message.error(e.message || '加载失败');
            } finally {
                setLoading(false);
            }
        })();
    }, [lastParams]);

    const submit = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        if (submitting) return;
        setSubmitting(true);
        try {
            const payload = {
                items: items.map(it => ({ question_id: it.question_id, answer: answers[it.question_id] }))
            };
            const r = await fetch('/api/practice/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            const j: any = await r.json();
            if (!j.success) throw new Error(j.error || '提交失败');
            setResult(j.data);
        } catch (e: any) {
            message.error(e.message || '提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container-page"><div className="container-inner"><div className="card"><div className="card-body">加载中...</div></div></div></div>;

    return (
        <div className="container-page">
            <PageHeader title="随时练习" />
            <div className="container-inner max-w-3xl space-y-4">
                {!result ? (
                    <>
                        <div className="space-y-4">
                            {items.map((it, idx) => (
                                <div key={it.question_id} className="card">
                                    <div className="card-body">
                                        <div className="text-sm muted mb-2">第 {idx + 1} 题 · {it.type}</div>
                                        <QuestionEditor item={it} value={answers[it.question_id]} onChange={v => setAnswers(prev => ({ ...prev, [it.question_id]: v }))} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2">
                            <button className="btn btn-primary" onClick={submit} disabled={submitting}>交卷并查看答案</button>
                        </div>
                        <div className="pt-1 text-sm muted">共 {items.length} 题</div>
                    </>
                ) : (
                    <ResultView items={items} result={result} onRetrySame={() => { setResult(null); setAnswers({}); setLastParams(p => ({ ...p })); }} onRetryWrong={() => {
                        const wrongIds = new Set((result?.results || []).filter(r => !r.correct).map(r => r.question_id));
                        const filtered = items.filter(it => wrongIds.has(it.question_id));
                        setItems(filtered);
                        setAnswers({});
                        setResult(null);
                    }} />
                )}
            </div>
        </div>
    );
}

function QuestionEditor({ item, value, onChange }: { item: PracticeItem; value: any; onChange: (v: any) => void }) {
    const q = item;
    if (q.type === 'single_choice') {
        const options: string[] = q.content?.options || [];
        return (
            <div className="space-y-2">
                <div>{q.content?.stem}</div>
                <div className="space-y-1">
                    {options.map((op: string, i: number) => (
                        <label key={i} className="block">
                            <input type="radio" name={`q-${q.question_id}`} checked={value === i} onChange={() => onChange(i)} /> {op}
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

function ResultView({ items, result, onRetrySame, onRetryWrong }: { items: PracticeItem[]; result: { results: Array<{ question_id: number; correct: boolean; score_unit: number; answer_key: any }>; correct_count: number; total: number }; onRetrySame: () => void; onRetryWrong: () => void; }) {
    const map = new Map(result.results.map(r => [r.question_id, r] as const));
    return (
        <div className="space-y-4">
            <div className="card">
                <div className="card-body flex items-center justify-between">
                    <div>正确 {result.correct_count} / {result.total}</div>
                    <div className="space-x-2">
                        <button className="btn" onClick={onRetrySame}>再来一组</button>
                        <button className="btn" onClick={onRetryWrong} disabled={result.correct_count === result.total}>错题重练</button>
                    </div>
                </div>
            </div>
            {items.map((it, idx) => {
                const r = map.get(it.question_id);
                const correct = r?.correct;
                return (
                    <div key={it.question_id} className="card">
                        <div className="card-body space-y-2">
                            <div className="text-sm muted">第 {idx + 1} 题 · {it.type} · {correct ? '正确' : '错误'}</div>
                            <QuestionSolution item={it} answerKey={r?.answer_key} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function QuestionSolution({ item, answerKey }: { item: PracticeItem; answerKey: any }) {
    const q = item;
    if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        const options: string[] = q.content?.options || [];
        return (
            <div className="space-y-1">
                <div>{q.content?.stem}</div>
                <div className="text-sm">参考答案：{Array.isArray(answerKey) ? answerKey.join(', ') : String(answerKey)}</div>
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
                <div className="text-sm">参考答案：{Array.isArray(answerKey) ? answerKey.join(' | ') : String(answerKey)}</div>
            </div>
        );
    }
    if (q.type === 'short_answer' || q.type === 'essay') {
        return (
            <div className="space-y-1">
                <div>{q.content?.prompt}</div>
                <div className="text-sm">参考答案：{String(answerKey ?? '（无）')}</div>
            </div>
        );
    }
    return <div>暂不支持的题型：{q.type}</div>;
}


