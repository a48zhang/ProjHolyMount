'use client';

import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

type QuestionType = 'single_choice' | 'multiple_choice' | 'fill_blank' | 'short_answer' | 'essay';

export default function QuestionView({
    type,
    content,
    answer,
}: {
    type: QuestionType;
    content: any;
    answer?: any;
}) {
    if (type === 'single_choice') {
        const options: string[] = content?.options || [];
        const selected = typeof answer === 'number' ? answer : undefined;
        return (
            <div className="space-y-2">
                <div className="font-medium" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content?.stem || '') }} />
                {Array.isArray(content?.images) && content.images.length ? (
                    <div className="flex flex-wrap gap-2">
                        {content.images.map((src: string, idx: number) => (
                            <img key={idx} src={src} alt="img" className="max-h-40 rounded" />
                        ))}
                    </div>
                ) : null}
                <ul className="space-y-1">
                    {options.map((op, i) => (
                        <li key={i} className={`px-2 py-1 rounded ${selected === i ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>{String.fromCharCode(65 + i)}. {op}</li>
                    ))}
                </ul>
            </div>
        );
    }
    if (type === 'multiple_choice') {
        const options: string[] = content?.options || [];
        const selected: number[] = Array.isArray(answer) ? answer : [];
        const sel = new Set(selected);
        return (
            <div className="space-y-2">
                <div className="font-medium" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content?.stem || '') }} />
                {Array.isArray(content?.images) && content.images.length ? (
                    <div className="flex flex-wrap gap-2">
                        {content.images.map((src: string, idx: number) => (
                            <img key={idx} src={src} alt="img" className="max-h-40 rounded" />
                        ))}
                    </div>
                ) : null}
                <ul className="space-y-1">
                    {options.map((op, i) => (
                        <li key={i} className={`px-2 py-1 rounded ${sel.has(i) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>{String.fromCharCode(65 + i)}. {op}</li>
                    ))}
                </ul>
            </div>
        );
    }
    if (type === 'fill_blank') {
        const blanks: number = content?.blanks?.length || 0;
        const answers: string[] = Array.isArray(answer) ? answer : [];
        return (
            <div className="space-y-2">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content?.text || '') }} />
                {Array.isArray(content?.images) && content.images.length ? (
                    <div className="flex flex-wrap gap-2">
                        {content.images.map((src: string, idx: number) => (
                            <img key={idx} src={src} alt="img" className="max-h-40 rounded" />
                        ))}
                    </div>
                ) : null}
                {blanks > 0 ? (
                    <div className="space-y-1 text-sm">
                        {Array.from({ length: blanks }).map((_, i) => (
                            <div key={i}>填空 {i + 1}：<span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{answers[i] ?? ''}</span></div>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }
    if (type === 'short_answer' || type === 'essay') {
        return (
            <div className="space-y-2">
                <div className="font-medium" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content?.prompt || '') }} />
                {Array.isArray(content?.images) && content.images.length ? (
                    <div className="flex flex-wrap gap-2">
                        {content.images.map((src: string, idx: number) => (
                            <img key={idx} src={src} alt="img" className="max-h-40 rounded" />
                        ))}
                    </div>
                ) : null}
                {answer ? <div className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">{String(answer)}</div> : null}
            </div>
        );
    }
    return <div className="text-sm text-gray-500">暂不支持的题型：{type}</div>;
}


