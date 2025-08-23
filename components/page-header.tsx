'use client';

import React from 'react';

export default function PageHeader({ title, extra }: { title: React.ReactNode; extra?: React.ReactNode }) {
    return (
        <div className="container-inner" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="text-lg" style={{ fontWeight: 600 }}>{title}</div>
                <div>{extra}</div>
            </div>
        </div>
    );
}





