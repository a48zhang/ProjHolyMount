'use client';

import React from 'react';

export function Skeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ height: 12, background: 'var(--color-border)', borderRadius: 6, opacity: 0.6 }} />
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="card">
            <div className="card-body">
                <div className="card-title">加载中</div>
                <Skeleton rows={5} />
            </div>
        </div>
    );
}





