'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Space, Modal, Form, Input, message, Select, Tag } from 'antd';
import { ThemeToggle } from '@/components/theme-toggle';


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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container-page">
      <div className="container-inner">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 用户信息卡片 */}
          <div className="md:col-span-1">
            <div className="card p-6">
              <div className="text-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl font-bold">
                      {(user.display_name || user.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h2 className="text-lg font-semibold">{user.display_name || user.username}</h2>
                <p className="text-sm muted">@{user.username}</p>
                <p className="text-sm muted">{user.email}</p>
                {user.role ? <div className="mt-2"><Tag color={user.role === 'admin' ? 'red' : user.role === 'teacher' ? 'green' : 'default'}>{roleLabel[user.role]}</Tag></div> : null}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm muted">等级</span>
                  <span className="text-sm font-semibold">{user.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm muted">积分</span>
                  <span className="text-sm font-semibold">{user.points}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm muted">注册时间</span>
                  <span className="text-sm muted">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={openEdit}>编辑资料</Button>
                  <Button onClick={() => { setRoleValue(user.role ?? 'student'); setRoleOpen(true); }}>修改角色</Button>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="card p-6 mt-6">
              <h3 className="card-title mb-4">快捷入口</h3>
              <div className="space-y-2">
                <Button block type="primary" onClick={() => router.push('/exams')}>进入考试</Button>
                {user.role === 'teacher' || user.role === 'admin' ? (
                  <>
                    <Button block onClick={() => router.push('/teacher/exams')}>教师中心（试卷）</Button>
                    <Button block onClick={() => router.push('/teacher/questions')}>题库管理</Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="md:col-span-2">
            {/* 考试入口卡片 */}
            <div className="card p-6 mb-6">
              <h3 className="card-title mb-4">考试入口</h3>
              <Space>
                <Button type="primary" onClick={() => router.push('/exams')}>我的考试</Button>
                {user.role === 'teacher' || user.role === 'admin' ? (
                  <>
                    <Button onClick={() => router.push('/teacher/exams')}>我创建的试卷</Button>
                    <Button onClick={() => router.push('/teacher/questions')}>题库</Button>
                  </>
                ) : null}
              </Space>
            </div>

            {/* 学习统计 */}
            <div className="card p-6 mb-6">
              <h3 className="card-title mb-4">学习统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
                  <div className="text-sm muted">已学单词</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                  <div className="text-sm muted">掌握单词</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0</div>
                  <div className="text-sm muted">今日学习</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
                  <div className="text-sm muted">连续天数</div>
                </div>
              </div>
            </div>

            {/* 今日推荐 */}
            <div className="card p-6 mb-6">
              <h3 className="card-title mb-4">今日推荐</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                  <h4 className="font-medium">今日单词</h4>
                  <p className="text-sm muted">开始学习今天的10个新单词</p>
                  <button className="mt-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600">
                    开始学习
                  </button>
                </div>
                <div className="border-l-4 border-green-500 dark:border-green-400 pl-4">
                  <h4 className="font-medium">复习提醒</h4>
                  <p className="text-sm muted">复习之前学过的单词</p>
                  <button className="mt-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-700 dark:hover:bg-green-600">
                    开始复习
                  </button>
                </div>
              </div>
            </div>

            {/* 学习进度 */}
            <div className="card p-6">
              <h3 className="card-title mb-4">学习进度</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>当前等级</span>
                    <span>等级 {user.level}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((user.points % 100), 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs muted mt-1">
                    {user.points % 100}/100 积分到下一级
                  </div>
                </div>
              </div>
            </div>

            {/* 推荐考试列表 */}
            <div className="card p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title">推荐考试</h3>
                <Button type="link" onClick={() => router.push('/exams?list=public')}>查看全部公开考试</Button>
              </div>
              <RecommendedExams />
            </div>
          </div>
        </div>
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
  if (loading) return <div className="text-sm text-gray-500">加载中...</div>;
  if (!items.length) return <div className="text-sm text-gray-500">暂无推荐考试</div>;
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {items.map((e) => (
        <li key={e.id} className="py-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{e.title}</div>
            <div className="text-xs text-gray-500">{e.duration_minutes ? `${e.duration_minutes} 分钟` : '不限时'} · 总分 {e.total_points}</div>
          </div>
          <Button type="primary" size="small" onClick={() => router.push(`/exams/${e.id}/take`)}>进入</Button>
        </li>
      ))}
    </ul>
  );
}