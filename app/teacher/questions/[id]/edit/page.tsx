'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Form, Input, Button, Switch, message } from 'antd';

export default function EditQuestionPage() {
    const { id } = useParams<{ id: string }>();
    const qid = Number(id);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(qid)) return;
        fetch(`/api/questions/${qid}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => {
                if (res.success) {
                    form.setFieldsValue({
                        content_json: JSON.stringify(res.data.content_json ?? {}, null, 2),
                        answer_key_json: JSON.stringify(res.data.answer_key_json ?? null, null, 2),
                        rubric_json: JSON.stringify(res.data.rubric_json ?? null, null, 2),
                        is_active: res.data.is_active === 1,
                    });
                } else message.error(res.error || '加载失败');
            })
            .finally(() => setLoading(false));
    }, [qid, form]);

    const save = async () => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        const v = await form.validateFields();
        try {
            const res = await fetch(`/api/questions/${qid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    content_json: JSON.parse(v.content_json || '{}'),
                    answer_key_json: v.answer_key_json ? JSON.parse(v.answer_key_json) : undefined,
                    rubric_json: v.rubric_json ? JSON.parse(v.rubric_json) : undefined,
                    is_active: v.is_active ? 1 : 0,
                })
            });
            const json: any = await res.json();
            if (json.success) message.success('已保存'); else message.error(json.error || '保存失败');
        } catch {
            message.error('JSON 格式错误');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card title={`编辑题目 #${qid}`} loading={loading}>
                <Form layout="vertical" form={form}>
                    <Form.Item name="content_json" label="内容 JSON" rules={[{ required: true }]}>
                        <Input.TextArea rows={8} />
                    </Form.Item>
                    <Form.Item name="answer_key_json" label="标准答案 JSON">
                        <Input.TextArea rows={6} />
                    </Form.Item>
                    <Form.Item name="rubric_json" label="评分规则 JSON">
                        <Input.TextArea rows={6} />
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


