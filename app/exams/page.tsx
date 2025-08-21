'use client';

import { Suspense, useEffect, useState } from 'react';
import { Button, Space, Tag, Card, Typography, Row, Col, Spin, Result } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ExamItem {
    id: number;
    title: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
    duration_minutes: number | null;
    total_points: number;
}

export default function ExamsPage() {
    return (
        <Suspense fallback={
            <div className="container-page">
                <div className="container-inner" style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                    <Title level={4} style={{ marginTop: 16, color: '#666' }}>
                        加载中...
                    </Title>
                </div>
            </div>
        }>
            <ExamsPageInner />
        </Suspense>
    );
}

function ExamsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPublic = (searchParams.get('list') || '').toLowerCase() === 'public';
    const [items, setItems] = useState<ExamItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!isPublic && !token) { router.push('/'); return; }
        const url = isPublic ? '/api/exams?list=public' : '/api/exams';
        fetch(url, { headers: isPublic ? ({} as any) : { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then((res: any) => {
                if (res.success) setItems(res.data || []);
                else setError(res.error || '获取考试失败');
            })
            .catch(() => setError('网络错误'))
            .finally(() => setLoading(false));
    }, [router, isPublic]);

    if (loading) {
        return (
            <div className="container-page">
                <div className="container-inner" style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                    <Title level={4} style={{ marginTop: 16, color: '#666' }}>
                        加载中...
                    </Title>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-page">
                <div className="container-inner">
                    <Result
                        status="error"
                        title="加载失败"
                        subTitle={error}
                        extra={[
                            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
                                重试
                            </Button>,
                            <Button key="back" onClick={() => router.push('/dashboard')}>
                                返回首页
                            </Button>
                        ]}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="container-page">
            <div className="container-inner">
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <Title level={2} style={{ margin: 0 }}>
                            {isPublic ? '公开考试' : '我的考试'}
                        </Title>
                        <Space size="small">
                            <Button
                                type={isPublic ? 'default' : 'primary'}
                                onClick={() => router.push('/exams')}
                            >
                                我的考试
                            </Button>
                            <Button
                                type={isPublic ? 'primary' : 'default'}
                                onClick={() => router.push('/exams?list=public')}
                            >
                                公开考试
                            </Button>
                        </Space>
                    </div>

                    {items.length === 0 ? (
                        <Result
                            icon={<BookOutlined />}
                            title="暂无考试"
                            subTitle={isPublic ? "当前没有公开的考试" : "您还没有参加任何考试"}
                            extra={
                                !isPublic ? (
                                    <Button type="primary" onClick={() => router.push('/exams?list=public')}>
                                        查看公开考试
                                    </Button>
                                ) : null
                            }
                        />
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {items.map((e) => (
                                <Card key={e.id} size="small" hoverable>
                                    <Row justify="space-between" align="middle">
                                        <Col flex="auto">
                                            <Title level={4} style={{ marginBottom: 8 }}>
                                                {e.title}
                                            </Title>
                                            <Space size="middle">
                                                <Text type="secondary">
                                                    <TrophyOutlined style={{ marginRight: 4 }} />
                                                    总分 {e.total_points}
                                                </Text>
                                                <Text type="secondary">
                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                    {e.duration_minutes ? `${e.duration_minutes} 分钟` : '不限时'}
                                                </Text>
                                            </Space>
                                        </Col>
                                        <Col>
                                            <Space size="small">
                                                <Tag color={e.status === 'published' ? 'blue' : e.status === 'closed' ? 'red' : 'default'}>
                                                    {e.status === 'published' ? '已发布' : e.status === 'closed' ? '已关闭' : '草稿'}
                                                </Tag>
                                                {e.status === 'published' ? (
                                                    isPublic ? (
                                                        <Button onClick={() => router.push(`/exams/${e.id}`)}>查看详情</Button>
                                                    ) : (
                                                        <Button
                                                            type="primary"
                                                            onClick={() => router.push(`/exams/${e.id}/take`)}
                                                        >
                                                            进入考试
                                                        </Button>
                                                    )
                                                ) : (
                                                    <Text type="secondary">未开始</Text>
                                                )}
                                            </Space>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                        </Space>
                    )}
                </Card>
            </div>
        </div>
    );
}

