'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, Tag, Button, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';

export default function ExamSubmissionsPage() {
    const { id } = useParams<{ id: string }>();
    const examId = Number(id);
    const router = useRouter();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(examId)) { router.push('/'); return; }
        fetch(`/api/exams/${examId}/submissions`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then((res: any) => {
                if (res.success) setRows(res.data || []);
                else message.error(res.error || '获取失败');
            })
            .finally(() => setLoading(false));
    }, [examId, router]);

    const columns: ColumnsType<any> = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: '学生ID', dataIndex: 'user_id', width: 120 },
        { title: '状态', dataIndex: 'status', width: 120, render: (v) => <Tag color={v === 'graded' ? 'green' : v === 'submitted' ? 'blue' : 'default'}>{v}</Tag> },
        { title: '自动分', dataIndex: 'score_auto', width: 120 },
        { title: '人工分', dataIndex: 'score_manual', width: 120 },
        { title: '总分', dataIndex: 'score_total', width: 120 },
        { title: '提交时间', dataIndex: 'submitted_at', width: 200, render: (v) => v || '-' },
        { title: '操作', width: 140, render: (_, r) => <Link href={`/teacher/grade/${r.id}`}><Button type="primary">评分</Button></Link> }
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl">
                <h1 className="mb-4">试卷 #{examId} 的提交</h1>
                <div className="card"><div className="card-body">
                    <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
                </div></div>
            </div>
        </div>
    );
}


