'use client';

import React from 'react';

export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div style={{ padding: 32, textAlign: 'center' }}>
            <div className="card" style={{ display: 'inline-block', minWidth: 320 }}>
                <div className="card-body">
                    <div className="card-title" style={{ marginBottom: 4 }}>{title}</div>
                    {description ? <div className="muted" style={{ marginBottom: 12 }}>{description}</div> : null}
                    {action}
                </div>
            </div>
        </div>
    );
}





