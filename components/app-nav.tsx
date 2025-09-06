'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Layout, Menu, Button, Drawer, Grid, Space, Typography, Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { MenuOutlined, ReadOutlined, ProfileOutlined, BookOutlined, LogoutOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

type Role = 'student' | 'teacher' | 'admin';

interface UserInfo {
    id: number;
    username: string;
    display_name: string;
    avatar_url?: string;
    role: Role;
    email: string;
}

function AppNavContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const screens = Grid.useBreakpoint();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => { 
                if (res?.success) {
                    setUser(res.data);
                    setRole(res.data.role as Role);
                }
            })
            .catch(() => { });
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setRole(null);
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
            {
                key: 'questions',
                icon: <BookOutlined />,
                label: (
                    <Link href="/questions" className="no-underline">
                        题库
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
                            试卷管理
                        </Link>
                    ),
                },
                {
                    key: 'teacher:questions',
                    icon: <BookOutlined />,
                    label: (
                        <Link href="/teacher/questions" className="no-underline">
                            题库管理
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
    
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: (
                <Link href="/me/profile" className="no-underline">
                    个人中心
                </Link>
            ),
        },
        {
            key: 'role',
            icon: <SettingOutlined />,
            label: (
                <span>
                    角色：{user && roleLabel[user.role]}
                </span>
            ),
            disabled: true,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: logout,
        },
    ];

    return (
        <Layout.Header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                paddingInline: 16,
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
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
                    <Link href="/" className="no-underline" style={{ fontWeight: 600, color: 'var(--color-title)' }}>
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
                    {user ? (
                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement="bottomRight"
                            trigger={['hover']}
                            overlayStyle={{ minWidth: 180 }}
                        >
                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar 
                                    size="small" 
                                    src={user.avatar_url} 
                                    icon={!user.avatar_url && <UserOutlined />}
                                />
                                <Typography.Text className="hidden md:inline">
                                    {user.display_name || user.username}
                                </Typography.Text>
                            </div>
                        </Dropdown>
                    ) : (
                        <Space>
                            <Link href="/login" className="no-underline">
                                <Button type="text">登录</Button>
                            </Link>
                            <Link href="/register" className="no-underline">
                                <Button type="primary">注册</Button>
                            </Link>
                            <ThemeToggle />
                        </Space>
                    )}
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
                {user && (
                    <div style={{ padding: 16, borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar 
                                size="large" 
                                src={user.avatar_url} 
                                icon={!user.avatar_url && <UserOutlined />}
                            />
                            <div>
                                <Typography.Text strong>{user.display_name || user.username}</Typography.Text>
                                <br />
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    角色：{roleLabel[user.role]}
                                </Typography.Text>
                            </div>
                        </div>
                    </div>
                )}
                <Menu
                    mode="inline"
                    selectedKeys={selectedKey ? [selectedKey] : []}
                    items={items}
                    onClick={() => setMobileOpen(false)}
                    style={{ borderInlineEnd: 'none' }}
                />
                {user ? (
                    <div style={{ padding: 12, borderTop: '1px solid var(--color-border)' }}>
                        <Link href="/me/profile" className="no-underline">
                            <Button block icon={<UserOutlined />} style={{ marginBottom: 8 }}>
                                个人中心
                            </Button>
                        </Link>
                        <Button block danger onClick={logout} icon={<LogoutOutlined />}>
                            退出登录
                        </Button>
                    </div>
                ) : (
                    <div style={{ padding: 12, borderTop: '1px solid var(--color-border)' }}>
                        <Link href="/login" className="no-underline">
                            <Button block type="primary" style={{ marginBottom: 8 }}>
                                登录
                            </Button>
                        </Link>
                        <Link href="/register" className="no-underline">
                            <Button block>注册</Button>
                        </Link>
                    </div>
                )}
            </Drawer>
        </Layout.Header>
    );
}

export default function AppNav() {
    return (
        <React.Suspense fallback={
            <Layout.Header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                paddingInline: 16,
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)'
            }}>
                <div style={{ height: '100%' }}></div>
            </Layout.Header>
        }>
            <AppNavContent />
        </React.Suspense>
    );
}
