'use client';

import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Select, message, Input, Drawer, Switch, Popconfirm } from 'antd';
import QuestionView from '@/components/question-view';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';


export default function TeacherQuestionsPage() {
    const router = useRouter();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState<string | undefined>(undefined);
    const [q, setQ] = useState('');
    const [preview, setPreview] = useState<any | null>(null);

    const load = () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        params.set('includeContent', 'true');
        fetch(`/api/questions?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => {
                if (res.success) {
                    const list = (res.data || []) as any[];
                    const filtered = q ? list.filter(it => JSON.stringify(it.content_json ?? {}).includes(q)) : list;
                    setRows(filtered);
                }
                else message.error(res.error || '获取题库失败');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [type, q]);

    const del = async (id: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`/api/questions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const json: any = await res.json();
        if (json.success) { message.success('已删除'); load(); } else { message.error(json.error || '删除失败'); }
    };

    const toggleActive = async (id: number, next: boolean) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`/api/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ is_active: next ? 1 : 0 }) });
        const json: any = await res.json();
        if (json.success) { message.success(next ? '已启用' : '已停用'); load(); } else { message.error(json.error || '操作失败'); }
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
        { title: '内容预览', dataIndex: 'content_json', render: (v) => <span className="text-gray-500 text-xs">{(v?.stem || v?.text || v?.prompt || '').slice(0, 40)}</span> },
        {
            title: '状态', dataIndex: 'is_active', width: 120, render: (v, r) => (
                <Space>
                    {v ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>}
                    <Switch size="small" checked={!!v} onChange={(checked) => toggleActive(r.id, checked)} />
                </Space>
            )
        },
        {
            title: '操作', width: 320, render: (_, r) => (
                <Space>
                    <Button onClick={() => setPreview(r)}>预览</Button>
                    <Button onClick={() => router.push(`/teacher/questions/${r.id}/edit`)}>编辑</Button>
                    <Popconfirm title="确认删除此题？" okText="删除" cancelText="取消" onConfirm={() => del(r.id)}>
                        <Button danger>删除</Button>
                    </Popconfirm>
                    <Button onClick={async () => {
                        const token = localStorage.getItem('token');
                        if (!token) return;
                        const res = await fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: r.type, content_json: r.content_json, answer_key_json: r.answer_key_json }) });
                        const json: any = await res.json();
                        if (json.success) message.success('已克隆'); else message.error(json.error || '克隆失败');
                    }}>克隆</Button>
                </Space>
            )
        }
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl">
                <div className="flex items-center justify-between mb-4">
                    <h1>题库</h1>
                    <Space>
                        <Input allowClear placeholder="搜索题干/内容" value={q} onChange={e => setQ(e.target.value)} style={{ width: 240 }} />
                        <Button onClick={() => load()}>刷新</Button>
                        <Button onClick={() => {
                            const csv = ['id,type,is_active,content', ...(rows || []).map((r: any) => `${r.id},${r.type},${r.is_active},${(r.content_json?.stem || r.content_json?.text || r.content_json?.prompt || '').replaceAll(',', ' ')}`)].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = 'questions.csv'; a.click(); URL.revokeObjectURL(url);
                        }}>导出CSV</Button>
                        <Button type="primary" onClick={() => router.push('/teacher/questions/new')}>新建题目</Button>
                    </Space>
                </div>
                <div className="card"><div className="card-body">
                    <div className="mb-4">
                        <Select allowClear placeholder="按题型过滤" style={{ width: 240 }} value={type} onChange={setType as any}
                            options={[
                                { value: 'single_choice', label: '单选题' },
                                { value: 'multiple_choice', label: '多选题' },
                                { value: 'fill_blank', label: '填空题' },
                                { value: 'short_answer', label: '简答题' },
                                { value: 'essay', label: '论述题' },
                            ]}
                        />
                    </div>
                    <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
                </div></div>
                <Drawer open={!!preview} onClose={() => setPreview(null)} title="题目预览" width={560}>
                    {preview ? (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-500">类型：{preview.type}</div>
                            <QuestionView type={preview.type} content={preview.content_json} />
                            <div>
                                <div className="text-sm text-gray-500 mb-1">参考答案</div>
                                <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-auto text-xs">{JSON.stringify(preview.answer_key_json, null, 2)}</pre>
                            </div>
                        </div>
                    ) : null}
                </Drawer>
            </div>
        </div>
    );
}


