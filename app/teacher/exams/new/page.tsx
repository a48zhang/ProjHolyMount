'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, InputNumber, Switch, Button, message, Select } from 'antd';
import { fetchJson, authHeaders } from '@/lib/http';

export default function NewExamPage() {
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const onFinish = async (values: any) => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        setSubmitting(true);
        try {
            const res = await fetchJson<any>('/api/exams', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({
                    title: values.title,
                    description: values.description || null,
                    duration_minutes: values.duration_minutes ?? null,
                    randomize: !!values.randomize,
                    is_public: values.is_public ? 1 : 0,
                    required_plan: values.required_plan || null,
                    required_grade_level: values.required_grade_level || null,
                })
            });
            if (res.success) {
                message.success('创建成功');
                router.push(`/teacher/exams/${res.data.id}/edit`);
            } else {
                message.error(res.error || '创建失败');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container-page">
            <div className="container-inner max-w-3xl">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">新建试卷</h1>
                    <Form layout="vertical" onFinish={onFinish} initialValues={{ randomize: false }}>
                        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                            <Input placeholder="例如：Unit 1 期中测试" />
                        </Form.Item>
                        <Form.Item name="description" label="描述">
                            <Input.TextArea rows={3} placeholder="可选" />
                        </Form.Item>
                        <Form.Item name="duration_minutes" label="时长（分钟）">
                            <InputNumber min={0} className="w-full" placeholder="0 表示不限时" />
                        </Form.Item>
                        <Form.Item name="randomize" label="题目乱序" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="is_public" label="公开试卷（推荐/公开列表可见）" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="required_plan" label="套餐要求">
                            <Select allowClear options={[{ value: 'free', label: 'free' }, { value: 'premium', label: 'premium' }]} />
                        </Form.Item>
                        <Form.Item name="required_grade_level" label="学段要求">
                            <Select allowClear options={[{ value: 'primary', label: 'primary' }, { value: 'junior', label: 'junior' }, { value: 'senior', label: 'senior' }, { value: 'college', label: 'college' }]} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={submitting}>创建</Button>
                        </Form.Item>
                    </Form>
                </div></div>
            </div>
        </div>
    );
}


