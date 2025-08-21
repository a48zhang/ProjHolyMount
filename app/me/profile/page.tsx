'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, message, Select } from 'antd';

export default function MeProfilePage() {
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''), []);

    useEffect(() => {
        if (!token) return;
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => {
                if (res.success) {
                    form.setFieldsValue({ display_name: res.data.display_name, grade_level: res.data.grade_level || null });
                }
            })
            .finally(() => setLoading(false));
    }, [token, form]);

    const save = async () => {
        const v = await form.validateFields();
        const res = await fetch('/api/me/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ display_name: v.display_name ?? null, grade_level: v.grade_level ?? null }) });
        const json: any = await res.json();
        if (json.success) message.success('已保存'); else message.error(json.error || '保存失败');
    };

    if (!token) return <div className="container-page"><div className="container-inner">请先登录</div></div>;
    if (loading) return <div className="container-page"><div className="container-inner">加载中...</div></div>;

    return (
        <div className="container-page">
            <div className="container-inner max-w-3xl">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">个人资料</h1>
                    <Form layout="vertical" form={form}>
                        <Form.Item name="display_name" label="显示名"><Input placeholder="选填" /></Form.Item>
                        <Form.Item name="grade_level" label="年级学段">
                            <Select allowClear options={[
                                { value: 'primary', label: 'primary' },
                                { value: 'junior', label: 'junior' },
                                { value: 'senior', label: 'senior' },
                                { value: 'college', label: 'college' },
                            ]} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" onClick={save}>保存</Button>
                        </Form.Item>
                    </Form>
                </div></div>
            </div>
        </div>
    );
}


