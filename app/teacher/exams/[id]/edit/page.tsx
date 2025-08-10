'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Form, Input, InputNumber, Switch, Button, message, Table, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { fetchJson, authHeaders } from '@/lib/http';

export default function EditExamPage() {
    const { id } = useParams<{ id: string }>();
    const examId = Number(id);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(examId)) return;
        Promise.all([
            fetchJson<any>(`/api/exams/${examId}`, { headers: authHeaders(token, false) }),
            fetchJson<any>(`/api/exams/${examId}/questions`, { headers: authHeaders(token, false) }),
        ]).then(([exam, eqs]) => {
            if (exam.success) {
                form.setFieldsValue({
                    title: exam.data.title,
                    description: exam.data.description,
                    duration_minutes: exam.data.duration_minutes,
                    randomize: !!exam.data.randomize,
                    required_plan: exam.data.required_plan,
                    required_grade_level: exam.data.required_grade_level,
                });
            }
            if (eqs.success) setRows(eqs.data.items || []);
        }).finally(() => setLoading(false));
    }, [examId, form]);

    const saveDraft = async () => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        const v = await form.validateFields();
        const res = await fetchJson<any>(`/api/exams/${examId}`, {
            method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({
                title: v.title,
                description: v.description ?? null,
                duration_minutes: v.duration_minutes ?? null,
                randomize: !!v.randomize,
                required_plan: v.required_plan ?? null,
                required_grade_level: v.required_grade_level ?? null,
            })
        });
        if (res.success) message.success('已保存'); else message.error(res.error || '保存失败');
    };

    const columns: ColumnsType<any> = [
        { title: '序号', dataIndex: 'order_index', width: 90 },
        { title: '题目ID', dataIndex: 'question_id', width: 120 },
        { title: '类型', dataIndex: ['question', 'type'], width: 160 },
        { title: '分值', dataIndex: 'points', width: 120 },
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl space-y-4">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">编辑试卷 #{examId}</h1>
                    <Form form={form} layout="vertical">
                        <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
                        <Form.Item name="duration_minutes" label="时长（分钟）"><InputNumber min={0} className="w-full" /></Form.Item>
                        <Form.Item name="randomize" label="题目乱序" valuePropName="checked"><Switch /></Form.Item>
                        <Space>
                            <Button type="primary" onClick={saveDraft}>保存</Button>
                        </Space>
                    </Form>
                </div></div>

                <div className="card"><div className="card-body">
                    <h2 className="card-title">题目列表</h2>
                    <Table rowKey="exam_question_id" columns={columns} dataSource={rows} pagination={false} />
                </div></div>
            </div>
        </div>
    );
}



