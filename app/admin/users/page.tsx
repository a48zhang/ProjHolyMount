'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Space, Table, message, DatePicker } from 'antd';

export default function AdminUsersPage() {
    const [query, setQuery] = useState('');
    const [role, setRole] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''), []);

    const load = async () => {
        if (!token) return message.error('未登录');
        setLoading(true);
        try {
            const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}&limit=50`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json: any = await res.json();
            if (json.success) setRows(json.data.users || []); else message.error(json.error || '加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: '用户名', dataIndex: 'username', width: 160 },
        { title: '邮箱', dataIndex: 'email', width: 220 },
        { title: '显示名', dataIndex: 'display_name', width: 160 },
        { title: '角色', dataIndex: 'role', width: 120 },
        { title: '套餐', dataIndex: 'plan', width: 120 },
        { title: '年级', dataIndex: 'grade_level', width: 120 },
        { title: '到期', dataIndex: 'plan_expires_at', width: 180 },
        {
            title: '操作', key: 'op', width: 360, render: (_: any, r: any) => {
                return <UserOpsRow user={r} refresh={load} />;
            }
        }
    ];

    return (
        <div className="container-page">
            <div className="container-inner max-w-6xl space-y-4">
                <h1 className="card-title">用户管理</h1>
                <Space>
                    <Input placeholder="关键字（用户名/邮箱）" value={query} onChange={e => setQuery(e.target.value)} onPressEnter={load} />
                    <Select value={role} onChange={setRole} options={[
                        { label: '全部角色', value: 'all' },
                        { label: '学生', value: 'student' },
                        { label: '教师', value: 'teacher' },
                        { label: '管理员', value: 'admin' },
                    ]} />
                    <Button type="primary" onClick={load} loading={loading}>搜索</Button>
                </Space>
                <Table rowKey="id" dataSource={rows} columns={columns as any} pagination={{ pageSize: 20 }} />
            </div>
        </div>
    );
}

function UserOpsRow({ user, refresh }: { user: any; refresh: () => void }) {
    const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''), []);
    const [role, setRole] = useState(user.role || 'student');
    const [plan, setPlan] = useState(user.plan || 'free');
    const [grade, setGrade] = useState(user.grade_level || null);
    const [expires, setExpires] = useState<string | null>(user.plan_expires_at || null);
    const [saving, setSaving] = useState(false);

    const saveRole = async () => {
        if (!token) return message.error('未登录');
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/role`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role }) });
            const json: any = await res.json();
            if (json.success) { message.success('已更新角色'); refresh(); } else { message.error(json.error || '失败'); }
        } finally { setSaving(false); }
    };

    const saveProfile = async () => {
        if (!token) return message.error('未登录');
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ plan, grade_level: grade, plan_expires_at: expires }) });
            const json: any = await res.json();
            if (json.success) { message.success('已更新档案'); refresh(); } else { message.error(json.error || '失败'); }
        } finally { setSaving(false); }
    };

    return (
        <Space>
            <span>
                角色：
                <Select style={{ width: 120 }} value={role} onChange={setRole} options={[
                    { label: 'student', value: 'student' },
                    { label: 'teacher', value: 'teacher' },
                    { label: 'admin', value: 'admin' },
                ]} />
                <Button size="small" onClick={saveRole} loading={saving}>保存角色</Button>
            </span>
            <span>
                套餐：
                <Select style={{ width: 120 }} value={plan} onChange={setPlan} options={[
                    { label: 'free', value: 'free' },
                    { label: 'premium', value: 'premium' },
                ]} />
            </span>
            <span>
                年级：
                <Input style={{ width: 120 }} value={grade || ''} onChange={e => setGrade(e.target.value || null)} />
            </span>
            <span>
                到期：
                <DatePicker showTime value={expires ? (expires as any) : null} onChange={(d) => setExpires(d ? (d.toDate?.().toISOString?.() || new Date(d as any).toISOString()) : null)} />
                <Button size="small" onClick={saveProfile} loading={saving}>保存档案</Button>
            </span>
        </Space>
    );
}


