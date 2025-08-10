'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, DatePicker, Button, Space, message, Table, Tag, Input, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { fetchJson, authHeaders } from '@/lib/http';

export default function PublishExamPage() {
    const { id } = useParams<{ id: string }>();
    const examId = Number(id);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [options, setOptions] = useState<{ label: string; value: number }[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [revokeIds, setRevokeIds] = useState<number[]>([]);
    const [dueAt, setDueAt] = useState<dayjs.Dayjs | null>(null);

    const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''), []);

    const loadAssignments = async () => {
        if (!token) return;
        const res = await fetchJson<any>(`/api/exams/${examId}/assignments`, { headers: authHeaders(token, false) });
        if (res.success) setAssignments(res.data.assignments || []);
    };

    useEffect(() => {
        if (!Number.isFinite(examId) || !token) return;
        loadAssignments().finally(() => setLoading(false));
    }, [examId, token]);

    const publish = async () => {
        if (!token) return message.error('未登录');
        if (!range) return message.error('请选择时间窗口');
        const res = await fetchJson<any>(`/api/exams/${examId}/publish`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ start_at: range[0].toISOString(), end_at: range[1].toISOString() })
        });
        if (res.success) { message.success('已发布'); } else { message.error(res.error || '发布失败'); }
    };

    const closeExam = async () => {
        if (!token) return message.error('未登录');
        const res = await fetchJson<any>(`/api/exams/${examId}/close`, { method: 'POST', headers: authHeaders(token) });
        if (res.success) { message.success('已关闭'); } else { message.error(res.error || '关闭失败'); }
    };

    const doSearch = async () => {
        if (!token) return message.error('未登录');
        setSearching(true);
        try {
            const res = await fetchJson<any>(`/api/users/search?role=student&query=${encodeURIComponent(query)}&limit=20`, { headers: authHeaders(token, false) });
            if (res.success) {
                setOptions((res.data.users || []).map((u: any) => ({ value: u.id, label: `${u.username} (${u.email})` })));
            } else {
                message.error(res.error || '搜索失败');
            }
        } finally {
            setSearching(false);
        }
    };

    const assign = async () => {
        if (!token) return message.error('未登录');
        if (selected.length === 0) return message.warning('请选择学生');
        const res = await fetchJson<any>(`/api/exams/${examId}/assign`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ user_ids: selected, due_at: dueAt ? dueAt.toISOString() : null })
        });
        if (res.success) {
            message.success(`已分配 ${res.data.assigned} 人`);
            setSelected([]);
            loadAssignments();
        } else {
            message.error(res.error || '分配失败');
        }
    };

    const columns: ColumnsType<any> = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: '学生ID', dataIndex: 'user_id', width: 120 },
        { title: '分配时间', dataIndex: 'assigned_at', width: 200 },
        { title: '截止时间', dataIndex: 'due_at', width: 200, render: (v) => v || '-' },
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl space-y-6">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">发布/分配 试卷 #{examId}</h1>
                    <Space align="center" wrap>
                        <DatePicker.RangePicker showTime value={range as any} onChange={(v) => setRange(v as any)} />
                        <Button type="primary" onClick={publish}>发布</Button>
                        <Button danger onClick={closeExam}>关闭试卷</Button>
                    </Space>
                </div></div>

                <div className="card"><div className="card-body">
                    <h2 className="card-title">分配学生</h2>
                    <Space direction="vertical" className="w-full">
                        <Space>
                            <Input placeholder="用户名/邮箱" value={query} onChange={(e) => setQuery(e.target.value)} onPressEnter={doSearch} />
                            <Button onClick={doSearch} loading={searching}>搜索</Button>
                        </Space>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="选择学生"
                            options={options}
                            value={selected}
                            onChange={(vals) => setSelected(vals as number[])}
                        />
                        <Space>
                            <DatePicker showTime placeholder="截止时间（可选）" value={dueAt as any} onChange={(v) => setDueAt(v as any)} />
                            <Button type="primary" onClick={assign}>分配</Button>
                        </Space>
                    </Space>
                </div></div>

                <div className="card"><div className="card-body">
                    <h2 className="card-title">已分配列表</h2>
                    <Space className="mb-2">
                        <Button onClick={() => loadAssignments()}>刷新</Button>
                        <Button danger disabled={!revokeIds.length} onClick={async () => {
                            if (!token) return message.error('未登录');
                            const res = await fetchJson<any>(`/api/exams/${examId}/assignments`, { method: 'DELETE', headers: authHeaders(token), body: JSON.stringify({ ids: revokeIds }) });
                            if (res.success) { message.success('已撤销'); setRevokeIds([]); loadAssignments(); } else { message.error(res.error || '撤销失败'); }
                        }}>撤销选中</Button>
                        <Button onClick={() => {
                            const csv = ['id,user_id,assigned_at,due_at', ...(assignments || []).map((a: any) => `${a.id},${a.user_id},${a.assigned_at || ''},${a.due_at || ''}`)].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = `assignments-${examId}.csv`; a.click(); URL.revokeObjectURL(url);
                        }}>导出CSV</Button>
                        <Button onClick={() => location.href = `/teacher/exams/${examId}/edit`}>返回编辑</Button>
                    </Space>
                    <Table rowKey="id" columns={columns} dataSource={assignments} loading={loading} pagination={{ pageSize: 10 }}
                        rowSelection={{ selectedRowKeys: revokeIds, onChange: (keys) => setRevokeIds(keys as number[]) }}
                    />
                </div></div>
            </div>
        </div>
    );
}



