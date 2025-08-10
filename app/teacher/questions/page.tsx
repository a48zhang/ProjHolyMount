'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Select, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';

export default function TeacherQuestionsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState<string | undefined>(undefined);

    const load = () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        params.set('includeContent', 'true');
        fetch(`/api/questions?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => {
                if (res.success) setRows(res.data || []);
                else message.error(res.error || '获取题库失败');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [type]);

    const del = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`/api/questions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const json: any = await res.json();
        if (json.success) { message.success('已删除'); load(); } else { message.error(json.error || '删除失败'); }
    };

    const columns: ColumnsType<any> = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: '类型', dataIndex: 'type', width: 160, render: (v) => <Tag>{v}</Tag> },
        { title: '内容预览', dataIndex: 'content_json', render: (v) => <span className="text-gray-500 text-xs">{(v?.stem || v?.text || v?.prompt || '').slice(0, 50)}</span> },
        { title: '状态', dataIndex: 'is_active', width: 100, render: (v) => v ? <Tag color="green">active</Tag> : <Tag>inactive</Tag> },
        {
            title: '操作', width: 200, render: (_, r) => (
                <Space>
                    <Link href={`/teacher/questions/${r.id}/edit`}><Button>编辑</Button></Link>
                    <Button danger onClick={() => del(r.id)}>删除</Button>
                </Space>
            )
        }
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl">
                <div className="flex items-center justify-between mb-4">
                    <h1>题库</h1>
                    <Link href="/teacher/questions/new"><Button type="primary">新建题目</Button></Link>
                </div>
                <div className="card"><div className="card-body">
                    <div className="mb-4">
                        <Select allowClear placeholder="按题型过滤" style={{ width: 240 }} value={type} onChange={setType as any}
                            options={[
                                'single_choice', 'multiple_choice', 'fill_blank', 'short_answer', 'essay'
                            ].map(v => ({ value: v, label: v }))}
                        />
                    </div>
                    <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
                </div></div>
            </div>
        </div>
    );
}


