'use client';

import { useState } from 'react';
import { Card, Form, Select, Button, message } from 'antd';
import QuestionEditor, { QuestionEditorValue } from '@/components/question-editor';

export default function NewQuestionPage() {
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [editor, setEditor] = useState<QuestionEditorValue | undefined>(undefined);

    const onFinish = async (values: any) => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        setSubmitting(true);
        try {
            const payload: QuestionEditorValue | undefined = editor;
            if (!payload) { message.error('请完善题目内容'); setSubmitting(false); return; }
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    type: values.type,
                    content_json: payload?.content ?? {},
                    answer_key_json: payload?.answerKey,
                })
            });
            const json: any = await res.json();
            if (json.success) message.success('创建成功'); else message.error(json.error || '创建失败');
        } catch {
            message.error('提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card title="新建题目">
                <Form layout="vertical" form={form} onFinish={onFinish} initialValues={{ type: 'single_choice' }} validateTrigger={['onSubmit']}>
                    <Form.Item name="type" label="题型" rules={[{ required: true }]}>
                        <Select
                            popupMatchSelectWidth={false}
                            showSearch={false}
                            virtual
                            onChange={() => setEditor(undefined)}
                            options={[
                                { value: 'single_choice', label: '单选题' },
                                { value: 'multiple_choice', label: '多选题' },
                                { value: 'fill_blank', label: '填空题' },
                                { value: 'short_answer', label: '简答题' },
                                { value: 'essay', label: '论述题' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
                        {({ getFieldValue }) => (
                            <div className="mb-4" key={getFieldValue('type') /* force remount to avoid state carryover */}>
                                <div className="mb-2 font-medium">题目内容</div>
                                <QuestionEditor type={getFieldValue('type')} value={editor} onChange={setEditor} />
                            </div>
                        )}
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={submitting}>创建</Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}


