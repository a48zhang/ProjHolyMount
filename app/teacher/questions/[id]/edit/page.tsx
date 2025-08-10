'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Form, Button, Switch, message, Select } from 'antd';
import QuestionEditor, { QuestionEditorValue } from '@/components/question-editor';

export default function EditQuestionPage() {
    const { id } = useParams<{ id: string }>();
    const qid = Number(id);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);

    const [type, setType] = useState<'single_choice' | 'multiple_choice' | 'fill_blank' | 'short_answer' | 'essay'>('single_choice');
    const [initial, setInitial] = useState<QuestionEditorValue | undefined>(undefined);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(qid)) return;
        fetch(`/api/questions/${qid}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => {
                if (res.success) {
                    setType(res.data.type);
                    setInitial({ content: res.data.content_json ?? {}, answerKey: res.data.answer_key_json ?? undefined });
                    form.setFieldsValue({ is_active: res.data.is_active === 1, type: res.data.type, editor: {} });
                } else message.error(res.error || '加载失败');
            })
            .finally(() => setLoading(false));
    }, [qid, form]);

    const save = async () => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        const v = await form.validateFields();
        try {
            const payload: QuestionEditorValue = v.editor;
            const res = await fetch(`/api/questions/${qid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    content_json: payload?.content ?? {},
                    answer_key_json: payload?.answerKey,
                    is_active: v.is_active ? 1 : 0,
                })
            });
            const json: any = await res.json();
            if (json.success) message.success('已保存'); else message.error(json.error || '保存失败');
        } catch {
            message.error('保存失败');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card title={`编辑题目 #${qid}`} loading={loading}>
                <Form layout="vertical" form={form} initialValues={{ type }}>
                    <Form.Item name="type" label="题型">
                        <Select
                            value={type}
                            onChange={(v) => setType(v)}
                            options={[
                                { value: 'single_choice', label: '单选题' },
                                { value: 'multiple_choice', label: '多选题' },
                                { value: 'fill_blank', label: '填空题' },
                                { value: 'short_answer', label: '简答题' },
                                { value: 'essay', label: '论述题' },
                            ]}
                            disabled
                        />
                    </Form.Item>
                    <Form.Item name="editor" label="题目内容" rules={[{ required: true, message: '请完善题目内容' }]}>
                        <QuestionEditor type={type} value={initial} />
                    </Form.Item>
                    <Form.Item name="is_active" label="激活" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={save}>保存</Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}


