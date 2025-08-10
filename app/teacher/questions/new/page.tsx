'use client';

import { useState } from 'react';
import { Card, Form, Select, Input, Button, message } from 'antd';

export default function NewQuestionPage() {
    const [submitting, setSubmitting] = useState(false);

    const onFinish = async (values: any) => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        setSubmitting(true);
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    type: values.type,
                    content_json: JSON.parse(values.content_json || '{}'),
                    answer_key_json: values.answer_key_json ? JSON.parse(values.answer_key_json) : undefined,
                    rubric_json: values.rubric_json ? JSON.parse(values.rubric_json) : undefined
                })
            });
            const json: any = await res.json();
            if (json.success) message.success('创建成功'); else message.error(json.error || '创建失败');
        } catch {
            message.error('JSON 格式错误');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card title="新建题目">
                <Form layout="vertical" onFinish={onFinish} initialValues={{ type: 'single_choice' }}>
                    <Form.Item name="type" label="题型" rules={[{ required: true }]}>
                        <Select options={['single_choice', 'multiple_choice', 'fill_blank', 'short_answer', 'essay'].map(v => ({ value: v, label: v }))} />
                    </Form.Item>
                    <Form.Item name="content_json" label="内容 JSON" rules={[{ required: true }]}>
                        <Input.TextArea rows={6} placeholder='例如：{"stem":"...","options":["A","B"],"blanks":[...]}' />
                    </Form.Item>
                    <Form.Item name="answer_key_json" label="标准答案 JSON（可选）">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="rubric_json" label="评分规则 JSON（可选）">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={submitting}>创建</Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}


