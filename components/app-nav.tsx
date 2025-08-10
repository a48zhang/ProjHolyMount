'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

type Role = 'student' | 'teacher' | 'admin';

export default function AppNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = useState<Role | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => { if (res.success) setRole(res.data.role as Role); })
            .catch(() => { });
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    useEffect(() => {
        if (typeof window !== 'undefined') setSearch(window.location.search);
    }, [pathname]);

    const isActive = (href: string) => pathname === href;
    const isPublicExams = pathname?.startsWith('/exams') && search.includes('list=public');

    const [open, setOpen] = useState(false);
    return (
        <header className="nav-shell">
            <div className="nav-inner">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="nav-brand">英语学习平台</Link>
                    <button className="nav-mobile-btn" onClick={() => setOpen(o => !o)}>
                        <span className="sr-only">菜单</span>☰
                    </button>
                    <nav className="nav-links">
                        <NavLink href="/exams" active={pathname === '/exams' && !isPublicExams}>我的考试</NavLink>
                        <NavLink href="/exams?list=public" active={isPublicExams}>公开考试</NavLink>
                        {(role === 'teacher' || role === 'admin') && (
                            <>
                                <NavLink href="/teacher/exams" active={pathname?.startsWith('/teacher/exams')}>试卷</NavLink>
                                <NavLink href="/teacher/questions" active={pathname?.startsWith('/teacher/questions')}>题库</NavLink>
                            </>
                        )}
                    </nav>
                </div>
                <div className="nav-right">
                    <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-400">{role ? `角色：${role}` : ''}</span>
                    <ThemeToggle />
                    <button className="btn btn-ghost" onClick={logout}>退出</button>
                </div>
            </div>
            {open && (
                <div className="nav-mobile-panel">
                    <div className="nav-mobile-list">
                        <NavLink href="/exams" active={pathname === '/exams' && !isPublicExams}>我的考试</NavLink>
                        <NavLink href="/exams?list=public" active={isPublicExams}>公开考试</NavLink>
                        {(role === 'teacher' || role === 'admin') && (
                            <>
                                <NavLink href="/teacher/exams" active={pathname?.startsWith('/teacher/exams')}>试卷</NavLink>
                                <NavLink href="/teacher/questions" active={pathname?.startsWith('/teacher/questions')}>题库</NavLink>
                            </>
                        )}
                        <button className="btn btn-ghost" onClick={logout}>退出</button>
                    </div>
                    <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
                </div>
            )}
        </header>
    );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
    return (
        <Link href={href} className={`nav-link ${active ? 'nav-link-active' : ''}`}>
            {children}
        </Link>
    );
}


