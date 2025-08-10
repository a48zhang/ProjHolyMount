'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Tag, Button, Space, message, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';

export default function ExamSubmissionsPage() {
    const { id } = useParams<{ id: string }>();
    const examId = Number(id);
    const router = useRouter();
    const [rows, setRows] = useState<any[]>([]);
    const [status, setStatus] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(examId)) { router.push('/'); return; }
        fetch(`/api/exams/${examId}/submissions`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then((res: any) => {
                if (res.success) {
                    const list = res.data || [];
                    setRows(status ? list.filter((r: any) => r.status === status) : list);
                }
                else message.error(res.error || '获取失败');
            })
            .finally(() => setLoading(false));
    }, [examId, router, status]);

    const columns: ColumnsType<any> = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: '学生ID', dataIndex: 'user_id', width: 120 },
        {
            title: '状态', dataIndex: 'status', width: 120, render: (v) => {
                const map: Record<string, string> = { in_progress: '进行中', submitted: '已提交', graded: '已评分' };
                return <Tag color={v === 'graded' ? 'green' : v === 'submitted' ? 'blue' : 'default'}>{map[v] || v}</Tag>;
            }
        },
        { title: '自动分', dataIndex: 'score_auto', width: 120 },
        { title: '人工分', dataIndex: 'score_manual', width: 120 },
        { title: '总分', dataIndex: 'score_total', width: 120 },
        { title: '提交时间', dataIndex: 'submitted_at', width: 200, render: (v) => v || '-' },
        { title: '操作', width: 140, render: (_, r) => <Button type="primary" onClick={() => router.push(`/teacher/grade/${r.id}`)}>评分</Button> }
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl">
                <div className="flex items-center justify-between mb-4">
                    <h1>试卷 #{examId} 的提交</h1>
                    <Space>
                        <Select allowClear placeholder="按状态过滤" style={{ width: 160 }} value={status} onChange={setStatus as any}
                            options={[
                                { value: 'in_progress', label: '进行中' },
                                { value: 'submitted', label: '已提交' },
                                { value: 'graded', label: '已评分' },
                            ]}
                        />
                        <Button onClick={() => location.href = `/teacher/exams/${examId}/publish`}>返回发布</Button>
                        <Button onClick={() => location.href = `/teacher/exams/${examId}/edit`}>返回编辑</Button>
                        <Button onClick={async () => {
                            const csv = ['id,user_id,status,score_auto,score_manual,score_total,submitted_at', ...(rows || []).map((r: any) => `${r.id},${r.user_id},${r.status},${r.score_auto},${r.score_manual},${r.score_total},${r.submitted_at || ''}`)].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = `submissions-${examId}.csv`; a.click(); URL.revokeObjectURL(url);
                        }}>导出CSV</Button>
                    </Space>
                </div>
                <div className="card"><div className="card-body">
                    <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
                </div></div>
            </div>
        </div>
    );
}


