'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Layout, Menu, Button, Drawer, Grid, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { MenuOutlined, ReadOutlined, ProfileOutlined, BookOutlined, LogoutOutlined } from '@ant-design/icons';

type Role = 'student' | 'teacher' | 'admin';

export default function AppNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [role, setRole] = useState<Role | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const screens = Grid.useBreakpoint();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => { if (res?.success) setRole(res.data.role as Role); })
            .catch(() => { });
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const isPublicExams = useMemo(() => {
        if (!pathname) return false;
        const list = searchParams?.get('list');
        return pathname.startsWith('/exams') && list === 'public';
    }, [pathname, searchParams]);

    const selectedKey = useMemo(() => {
        if (!pathname) return '';
        if (pathname.startsWith('/teacher/questions')) return 'teacher:questions';
        if (pathname.startsWith('/teacher/exams')) return 'teacher:exams';
        if (pathname === '/exams' || pathname.startsWith('/exams')) return isPublicExams ? 'exams:public' : 'exams:mine';
        return '';
    }, [pathname, isPublicExams]);

    const items: MenuProps['items'] = useMemo(() => {
        const base: MenuProps['items'] = [
            {
                key: 'exams:mine',
                icon: <ReadOutlined />,
                label: (
                    <Link href="/exams" className="no-underline">
                        我的考试
                    </Link>
                ),
            },
            {
                key: 'exams:public',
                icon: <ProfileOutlined />,
                label: (
                    <Link href="/exams?list=public" className="no-underline">
                        公开考试
                    </Link>
                ),
            },
        ];

        if (role === 'teacher' || role === 'admin') {
            base.push(
                {
                    key: 'teacher:exams',
                    icon: <ProfileOutlined />,
                    label: (
                        <Link href="/teacher/exams" className="no-underline">
                            试卷
                        </Link>
                    ),
                },
                {
                    key: 'teacher:questions',
                    icon: <BookOutlined />,
                    label: (
                        <Link href="/teacher/questions" className="no-underline">
                            题库
                        </Link>
                    ),
                },
            );
        }

        if (role === 'admin') {
            base.push({
                key: 'admin:home',
                icon: <ProfileOutlined />,
                label: (
                    <Link href="/admin" className="no-underline">Admin</Link>
                ),
            });
        }

        return base;
    }, [role]);

    const roleLabel: Record<Role, string> = { student: '学生', teacher: '老师', admin: '管理员' };
    return (
        <Layout.Header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                paddingInline: 16,
                borderBottom: '1px solid var(--card-border)',
                background: 'var(--background)'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: 896,
                    margin: '0 auto',
                    width: '100%',
                    gap: 12,
                    height: '100%'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {!screens.md && (
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            aria-label="打开菜单"
                            onClick={() => setMobileOpen(true)}
                        />
                    )}
                    <Link href="/dashboard" className="no-underline" style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                        英语学习平台
                    </Link>
                    {screens.md && (
                        <Menu
                            mode="horizontal"
                            selectedKeys={selectedKey ? [selectedKey] : []}
                            items={items}
                            style={{ borderBottom: 'none', minWidth: 0 }}
                        />
                    )}
                </div>
                <Space align="center" size={12}>
                    {role ? (
                        <Typography.Text type="secondary" className="hidden md:inline">
                            角色：{roleLabel[role]}
                        </Typography.Text>
                    ) : null}
                    <ThemeToggle />
                    <Button type="text" onClick={logout} icon={<LogoutOutlined />}>退出</Button>
                </Space>
            </div>

            <Drawer
                title="导航"
                placement="left"
                closable
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                bodyStyle={{ padding: 0 }}
            >
                <Menu
                    mode="inline"
                    selectedKeys={selectedKey ? [selectedKey] : []}
                    items={items}
                    onClick={() => setMobileOpen(false)}
                    style={{ borderInlineEnd: 'none' }}
                />
                <div style={{ padding: 12 }}>
                    <Button block onClick={logout} icon={<LogoutOutlined />}>退出</Button>
                </div>
            </Drawer>
        </Layout.Header>
    );
}
