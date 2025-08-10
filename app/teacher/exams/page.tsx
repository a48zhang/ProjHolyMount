'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Space, Tag, message } from 'antd';
import Link from 'next/link';
import type { ColumnsType } from 'antd/es/table';
import { fetchJson, authHeaders } from '@/lib/http';

interface ExamRow {
    id: number;
    title: string;
    status: string;
    total_points: number;
    start_at: string | null;
    end_at: string | null;
    duration_minutes: number | null;
}

export default function TeacherExamsPage() {
    const router = useRouter();
    const [rows, setRows] = useState<ExamRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchJson<any>('/api/exams', { headers: authHeaders(token, false) })
            .then(res => {
                if (res.success) setRows(res.data || []);
                else message.error(res.error || '获取试卷失败');
            })
            .finally(() => setLoading(false));
    }, [router]);

    const columns: ColumnsType<ExamRow> = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: '标题', dataIndex: 'title' },
        { title: '分值', dataIndex: 'total_points', width: 100 },
        {
            title: '状态', dataIndex: 'status', width: 120,
            render: (v: string) => <Tag color={v === 'published' ? 'blue' : v === 'closed' ? 'red' : 'default'}>{v}</Tag>
        },
        {
            title: '操作', width: 280,
            render: (_, r) => (
                <Space>
                    <Link href={`/teacher/exams/${r.id}/edit`}><Button>编辑</Button></Link>
                    <Link href={`/teacher/exams/${r.id}/publish`}><Button>发布/分配</Button></Link>
                    <Link href={`/teacher/exams/${r.id}/submissions`}><Button type="primary">提交</Button></Link>
                </Space>
            )
        }
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl">
                <div className="flex items-center justify-between mb-4">
                    <h1>我创建的试卷</h1>
                    <Link href="/teacher/exams/new"><Button type="primary">新建试卷</Button></Link>
                </div>
                <div className="card"><div className="card-body">
                    <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
                </div></div>
            </div>
        </div>
    );
}



