'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Space, Modal, Form, Input, message, Select, Tag, Card, Typography, Avatar, Statistic, Row, Col, Divider, Spin, Result } from 'antd';
import { UserOutlined, BookOutlined, TrophyOutlined, CalendarOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { ThemeToggle } from '@/components/theme-toggle';

const { Title, Text, Paragraph } = Typography;


interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  level: number;
  points: number;
  created_at: string;
  role?: 'student' | 'teacher' | 'admin';
  plan?: string;
  grade_level?: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm<{ display_name?: string; avatar_url?: string }>();
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleValue, setRoleValue] = useState<'student' | 'teacher' | 'admin' | undefined>(undefined);
  const roleLabel: Record<'student' | 'teacher' | 'admin', string> = { student: '学生', teacher: '老师', admin: '管理员' };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchUserInfo(token);
  }, [router]);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json() as { success: boolean; data: User; error?: string };

      if (data.success) {
        setUser(data.data);
      } else {
        setError(data.error || '获取用户信息失败');
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
        }
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const openEdit = () => {
    if (!user) return;
    form.setFieldsValue({ display_name: user.display_name, avatar_url: user.avatar_url ?? undefined });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    const values = await form.validateFields();
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch('/api/me/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const json: any = await res.json();
    if (json.success) {
      message.success('已更新');
      setEditOpen(false);
      fetchUserInfo(token);
    } else {
      message.error(json.error || '更新失败');
    }
  };

  if (loading) {
    return (
      <div className="container-page">
        <div className="container-inner">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 16, color: '#666' }}>
              加载中...
            </Title>
          </div>
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
              <Button key="home" onClick={() => router.push('/')}>
                返回首页
              </Button>
            ]}
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container-page">
      <div className="container-inner">
        <Row gutter={[24, 24]}>
          {/* 用户信息卡片 */}
          <Col xs={24} md={8}>
            <Card>
              <div className="text-center">
                {user.avatar_url ? (
                  <Avatar size={64} src={user.avatar_url} className="mb-4" />
                ) : (
                  <Avatar 
                    size={64} 
                    icon={<UserOutlined />} 
                    className="mb-4"
                    style={{ backgroundColor: '#1677ff' }}
                  >
                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Title level={3} style={{ marginBottom: 8 }}>
                  {user.display_name || user.username}
                </Title>
                <Text type="secondary">@{user.username}</Text>
                <br />
                <Text type="secondary">{user.email}</Text>
                {user.role && (
                  <div style={{ marginTop: 8 }}>
                    <Tag color={user.role === 'admin' ? 'red' : user.role === 'teacher' ? 'green' : 'default'}>
                      {roleLabel[user.role]}
                    </Tag>
                  </div>
                )}
              </div>

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row justify="space-between">
                  <Text type="secondary">等级</Text>
                  <Text strong>{user.level}</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">积分</Text>
                  <Text strong>{user.points}</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">注册时间</Text>
                  <Text type="secondary">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </Text>
                </Row>
                
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Button 
                      block 
                      icon={<EditOutlined />} 
                      onClick={openEdit}
                    >
                      编辑资料
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button 
                      block 
                      icon={<TeamOutlined />} 
                      onClick={() => { setRoleValue(user.role ?? 'student'); setRoleOpen(true); }}
                    >
                      修改角色
                    </Button>
                  </Col>
                </Row>
              </Space>
            </Card>

            {/* 快速操作 */}
            <Card title="快捷入口" style={{ marginTop: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Button 
                  block 
                  type="primary" 
                  size="large" 
                  icon={<BookOutlined />} 
                  onClick={() => router.push('/exams')}
                >
                  进入考试
                </Button>
                {user.role === 'teacher' || user.role === 'admin' ? (
                  <>
                    <Button 
                      block 
                      onClick={() => router.push('/teacher/exams')}
                    >
                      教师中心（试卷）
                    </Button>
                    <Button 
                      block 
                      onClick={() => router.push('/teacher/questions')}
                    >
                      题库管理
                    </Button>
                  </>
                ) : null}
              </Space>
            </Card>
          </Col>

          {/* 主要内容区域 */}
          <Col xs={24} md={16}>
            {/* 考试入口卡片 */}
            <Card title="考试入口" style={{ marginBottom: 24 }}>
              <Space wrap>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<BookOutlined />} 
                  onClick={() => router.push('/exams')}
                >
                  我的考试
                </Button>
                {user.role === 'teacher' || user.role === 'admin' ? (
                  <>
                    <Button 
                      size="large" 
                      onClick={() => router.push('/teacher/exams')}
                    >
                      我创建的试卷
                    </Button>
                    <Button 
                      size="large" 
                      onClick={() => router.push('/teacher/questions')}
                    >
                      题库
                    </Button>
                  </>
                ) : null}
              </Space>
            </Card>

            {/* 学习统计 */}
            <Card title="学习统计" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Card size="small" className="text-center">
                    <Statistic
                      title="已学单词"
                      value={0}
                      valueStyle={{ color: '#1677ff' }}
                      prefix={<BookOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" className="text-center">
                    <Statistic
                      title="掌握单词"
                      value={0}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<TrophyOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" className="text-center">
                    <Statistic
                      title="今日学习"
                      value={0}
                      valueStyle={{ color: '#faad14' }}
                      prefix={<CalendarOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" className="text-center">
                    <Statistic
                      title="连续天数"
                      value={0}
                      valueStyle={{ color: '#722ed1' }}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* 今日推荐 */}
            <Card title="今日推荐" style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card size="small" style={{ borderLeft: '4px solid #1677ff' }}>
                  <Title level={5} style={{ marginBottom: 8 }}>今日单词</Title>
                  <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                    开始学习今天的10个新单词
                  </Paragraph>
                  <Button type="primary">开始学习</Button>
                </Card>
                <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
                  <Title level={5} style={{ marginBottom: 8 }}>复习提醒</Title>
                  <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                    复习之前学过的单词
                  </Paragraph>
                  <Button type="primary" style={{ backgroundColor: '#52c41a' }}>开始复习</Button>
                </Card>
              </Space>
            </Card>

            {/* 学习进度 */}
            <Card title="学习进度" style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Text type="secondary">当前等级</Text>
                  <Text strong>等级 {user.level}</Text>
                </Row>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((user.points % 100), 100)}%` }}
                  ></div>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user.points % 100}/100 积分到下一级
                </Text>
              </Space>
            </Card>

            {/* 推荐考试列表 */}
            <Card 
              title="推荐考试"
              extra={
                <Button 
                  type="link" 
                  onClick={() => router.push('/exams?list=public')}
                >
                  查看全部公开考试
                </Button>
              }
            >
              <RecommendedExams />
            </Card>
          </Col>
        </Row>
      </div>
      <Modal
        open={editOpen}
        title="编辑个人资料"
        onOk={submitEdit}
        onCancel={() => setEditOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="display_name" label="显示名称">
            <Input allowClear placeholder="输入显示名称" />
          </Form.Item>
          <Form.Item name="avatar_url" label="头像地址">
            <Input allowClear placeholder="输入头像图片 URL" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={roleOpen}
        title="修改角色"
        onOk={async () => {
          const token = localStorage.getItem('token');
          if (!token || !roleValue) { setRoleOpen(false); return; }
          const res = await fetch('/api/me/role', {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: roleValue })
          });
          const json: any = await res.json();
          if (json.success) {
            message.success('角色已更新');
            setRoleOpen(false);
            fetchUserInfo(token);
          } else {
            message.error(json.error || '更新失败');
          }
        }}
        onCancel={() => setRoleOpen(false)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ disabled: roleValue === (user?.role ?? 'student') }}
      >
        {(() => {
          const rank: Record<'student' | 'teacher' | 'admin', number> = { student: 1, teacher: 2, admin: 3 };
          const current = (user?.role ?? 'student') as 'student' | 'teacher' | 'admin';
          const opts = (['student', 'teacher', 'admin'] as const)
            .filter(r => rank[r] <= rank[current])
            .map(r => ({ value: r, label: roleLabel[r] }));
          return (
            <Select
              value={roleValue}
              onChange={(v) => setRoleValue(v as any)}
              options={opts}
              style={{ width: '100%' }}
            />
          );
        })()}
      </Modal>
    </div>
  );
}

function RecommendedExams() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/exams?list=public&limit=5`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then(r => r.json() as Promise<any>)
      .then(res => { if (res.success) setItems(res.data || []); })
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <Text type="secondary">加载中...</Text>;
  if (!items.length) return <Text type="secondary">暂无推荐考试</Text>;
  
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {items.map((e) => (
        <Card key={e.id} size="small">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={5} style={{ marginBottom: 4 }}>{e.title}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {e.duration_minutes ? `${e.duration_minutes} 分钟` : '不限时'} · 总分 {e.total_points}
              </Text>
            </Col>
            <Col>
              <Button 
                type="primary" 
                size="small" 
                onClick={() => router.push(`/exams/${e.id}/take`)}
              >
                进入
              </Button>
            </Col>
          </Row>
        </Card>
      ))}
    </Space>
  );
}