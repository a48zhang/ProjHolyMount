'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Select, message, Card, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function TeacherQuestionsPage() {
    const router = useRouter();
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
        {
            title: '类型', dataIndex: 'type', width: 160, render: (v) => {
                const map: Record<string, string> = {
                    single_choice: '单选题',
                    multiple_choice: '多选题',
                    fill_blank: '填空题',
                    short_answer: '简答题',
                    essay: '论述题',
                };
                return <Tag>{map[v] || v}</Tag>;
            }
        },
        { title: '内容预览', dataIndex: 'content_json', render: (v) => <span className="text-gray-500 text-xs">{(v?.stem || v?.text || v?.prompt || '').slice(0, 50)}</span> },
        { title: '状态', dataIndex: 'is_active', width: 100, render: (v) => v ? <Tag color="green">启用</Tag> : <Tag>停用</Tag> },
        {
            title: '操作', width: 200, render: (_, r) => (
                <Space>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => router.push(`/teacher/questions/${r.id}/edit`)}
                    >
                        编辑
                    </Button>
                    <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => del(r.id)}
                    >
                        删除
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl">
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <Title level={2} style={{ margin: 0 }}>题库管理</Title>
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<PlusOutlined />} 
                            onClick={() => router.push('/teacher/questions/new')}
                        >
                            新建题目
                        </Button>
                    </div>
                    
                    <div style={{ marginBottom: 16 }}>
                        <Select 
                            allowClear 
                            placeholder="按题型过滤" 
                            style={{ width: 240 }} 
                            value={type} 
                            onChange={setType as any}
                            options={[
                                { value: 'single_choice', label: '单选题' },
                                { value: 'multiple_choice', label: '多选题' },
                                { value: 'fill_blank', label: '填空题' },
                                { value: 'short_answer', label: '简答题' },
                                { value: 'essay', label: '论述题' },
                            ]}
                        />
                    </div>
                    
                    <Table 
                        rowKey="id" 
                        columns={columns} 
                        dataSource={rows} 
                        loading={loading} 
                        pagination={{ 
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 条记录`
                        }} 
                    />
                </Card>
            </div>
        </div>
    );
}


