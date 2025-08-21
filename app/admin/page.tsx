'use client';

import Link from 'next/link';

export default function AdminHome() {
    return (
        <div className="container-page">
            <div className="container-inner max-w-4xl space-y-4">
                <h1 className="text-2xl font-semibold">管理员控制台</h1>
                <ul className="list-disc pl-6 space-y-2">
                    <li><Link className="link" href="/admin/users">用户管理</Link></li>
                </ul>
            </div>
        </div>
    );
}


