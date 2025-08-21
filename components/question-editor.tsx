'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Button, Input, Radio, Checkbox, Space, Divider, InputNumber } from 'antd';

type QuestionType = 'single_choice' | 'multiple_choice' | 'fill_blank' | 'short_answer' | 'essay';

export interface QuestionEditorValue {
    content: any;
    answerKey?: any;
}

function QuestionEditor({
    type,
    value,
    onChange,
}: {
    type: QuestionType;
    value?: QuestionEditorValue;
    onChange?: (v: QuestionEditorValue) => void;
}) {
    const [stem, setStem] = useState<string>('');
    const [options, setOptions] = useState<string[]>(() => ['', '']);
    const [singleKey, setSingleKey] = useState<number>(0);
    const [multiKey, setMultiKey] = useState<number[]>([]);
    const [text, setText] = useState<string>('');
    const [blankCount, setBlankCount] = useState<number>(1);
    const [blankKeys, setBlankKeys] = useState<string[]>(() => ['']);
    const [prompt, setPrompt] = useState<string>('');

    const syncingRef = useRef(false);
    const prevTypeRef = useRef<QuestionType | null>(null);
    const mountedRef = useRef(false);

    // Initialize from external value (avoid emitting change)
    useEffect(() => {
        if (!value) return;
        syncingRef.current = true;
        if (type === 'single_choice') {
            setStem(value.content?.stem ?? '');
            const ops: string[] = Array.isArray(value.content?.options) && value.content.options.length > 0 ? value.content.options : ['', ''];
            setOptions(ops);
            setSingleKey(Number.isFinite(value.answerKey) ? Number(value.answerKey) : 0);
        } else if (type === 'multiple_choice') {
            setStem(value.content?.stem ?? '');
            const ops: string[] = Array.isArray(value.content?.options) && value.content.options.length > 0 ? value.content.options : ['', ''];
            setOptions(ops);
            setMultiKey(Array.isArray(value.answerKey) ? value.answerKey : []);
        } else if (type === 'fill_blank') {
            setText(value.content?.text ?? '');
            const blanksLen: number = Array.isArray(value.content?.blanks) ? value.content.blanks.length : 1;
            setBlankCount(Math.max(1, blanksLen));
            const keysRaw: any[] = Array.isArray(value.answerKey) ? value.answerKey : [];
            const keys: string[] = (keysRaw.length ? keysRaw : Array.from({ length: blanksLen || 1 }, () => ''))
                .map((k: any) => Array.isArray(k) ? (k as any[]).map(s => String(s || '').trim()).filter(Boolean).join(' | ') : String(k || ''));
            setBlankKeys(keys.length ? keys : Array.from({ length: blanksLen || 1 }, () => ''));
        } else if (type === 'short_answer' || type === 'essay') {
            setPrompt(value.content?.prompt ?? '');
        }
    }, [type, value]);

    // Emit changes upward (skip when syncing from parent / first mount / type switches)
    useEffect(() => {
        if (!onChange) return;
        if (syncingRef.current) {
            // reset flag and skip emit for this sync cycle
            syncingRef.current = false;
            return;
        }
        // skip first mount
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }
        // skip once when type just changed
        if (prevTypeRef.current !== type) {
            prevTypeRef.current = type;
            return;
        }
        if (type === 'single_choice') {
            onChange({ content: { stem, options }, answerKey: singleKey });
        } else if (type === 'multiple_choice') {
            onChange({ content: { stem, options }, answerKey: multiKey });
        } else if (type === 'fill_blank') {
            const normalizedKeys = blankKeys.slice(0, blankCount).map((k) => {
                const parts = String(k ?? '')
                    .split('|')
                    .map(s => s.trim())
                    .filter(Boolean);
                return parts.length <= 1 ? (parts[0] ?? '') : parts;
            });
            onChange({ content: { text, blanks: Array.from({ length: blankCount }) }, answerKey: normalizedKeys });
        } else if (type === 'short_answer' || type === 'essay') {
            onChange({ content: { prompt } });
        }
    }, [type, stem, options, singleKey, multiKey, text, blankCount, blankKeys, prompt, onChange]);

    const addOption = useCallback(() => setOptions(prev => [...prev, '']), []);
    const removeOption = useCallback((idx: number) => setOptions(prev => prev.filter((_, i) => i !== idx)), []);

    useEffect(() => {
        // keep blank keys length in sync
        if (blankKeys.length < blankCount) {
            setBlankKeys(prev => [...prev, ...Array.from({ length: blankCount - prev.length }, () => '')]);
        } else if (blankKeys.length > blankCount) {
            setBlankKeys(prev => prev.slice(0, blankCount));
        }
    }, [blankCount]);

    if (type === 'single_choice') {
        return (
            <div className="space-y-3">
                <div>
                    <div className="mb-1">题干</div>
                    <Input.TextArea value={stem} onChange={e => setStem(e.target.value)} autoSize={{ minRows: 2 }} placeholder="请输入题干" />
                </div>
                <Divider orientation="left">选项</Divider>
                <Radio.Group value={singleKey} onChange={e => setSingleKey(e.target.value)}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {options.map((op, i) => (
                            <Space key={i} style={{ display: 'flex' }}>
                                <Radio value={i} />
                                <Input value={op} placeholder={`选项 ${i + 1}`} onChange={e => setOptions(prev => prev.map((v, idx) => (idx === i ? e.target.value : v)))} />
                                {options.length > 2 ? (
                                    <Button onClick={() => removeOption(i)}>删除</Button>
                                ) : null}
                            </Space>
                        ))}
                        <Button onClick={addOption}>添加选项</Button>
                    </Space>
                </Radio.Group>
            </div>
        );
    }

    if (type === 'multiple_choice') {
        return (
            <div className="space-y-3">
                <div>
                    <div className="mb-1">题干</div>
                    <Input.TextArea value={stem} onChange={e => setStem(e.target.value)} autoSize={{ minRows: 2 }} placeholder="请输入题干" />
                </div>
                <Divider orientation="left">选项（勾选为正确答案）</Divider>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {options.map((op, i) => (
                        <Space key={i} style={{ display: 'flex' }}>
                            <Checkbox checked={multiKey.includes(i)} onChange={e => setMultiKey(prev => (e.target.checked ? [...prev, i] : prev.filter(v => v !== i)))} />
                            <Input value={op} placeholder={`选项 ${i + 1}`} onChange={e => setOptions(prev => prev.map((v, idx) => (idx === i ? e.target.value : v)))} />
                            {options.length > 2 ? (
                                <Button onClick={() => removeOption(i)}>删除</Button>
                            ) : null}
                        </Space>
                    ))}
                    <Button onClick={addOption}>添加选项</Button>
                </Space>
            </div>
        );
    }

    if (type === 'fill_blank') {
        return (
            <div className="space-y-3">
                <div>
                    <div className="mb-1">题目文本</div>
                    <Input.TextArea value={text} onChange={e => setText(e.target.value)} autoSize={{ minRows: 2 }} placeholder="请输入题目文本" />
                </div>
                <div>
                    <div className="mb-1">空格数量</div>
                    <InputNumber min={1} max={20} value={blankCount} onChange={v => setBlankCount(Number(v) || 1)} />
                </div>
                <Divider orientation="left">每空参考答案（可留空；多个同义答案用 | 分隔）</Divider>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {Array.from({ length: blankCount }).map((_, i) => (
                        <Input key={i} value={blankKeys[i] || ''} placeholder={`第 ${i + 1} 空参考答案（如：答案A | 答案B）`} onChange={e => setBlankKeys(prev => prev.map((v, idx) => (idx === i ? e.target.value : v)))} />
                    ))}
                </Space>
            </div>
        );
    }

    if (type === 'short_answer' || type === 'essay') {
        return (
            <div className="space-y-3">
                <div>
                    <div className="mb-1">提示</div>
                    <Input.TextArea value={prompt} onChange={e => setPrompt(e.target.value)} autoSize={{ minRows: 2 }} placeholder="请输入作答提示" />
                </div>
            </div>
        );
    }

    return <div>暂不支持的题型</div>;
}

export default React.memo(QuestionEditor);
