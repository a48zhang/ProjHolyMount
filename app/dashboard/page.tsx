'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';


interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-bold">
                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user.display_name || user.username}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">等级</span>
                  <span className="text-sm font-semibold">{user.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">积分</span>
                  <span className="text-sm font-semibold">{user.points}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">注册时间</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快捷入口</h3>
              <div className="space-y-2">
                <Link href="/exams" className="block w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  进入考试
                </Link>
                {user.role === 'teacher' || user.role === 'admin' ? (
                  <>
                    <Link href="/teacher/exams" className="block w-full px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">
                      教师中心（试卷）
                    </Link>
                    <Link href="/teacher/questions" className="block w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
                      题库管理
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="md:col-span-2">
            {/* 考试入口卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">考试入口</h3>
              <div className="flex items-center gap-3">
                <Link href="/exams" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">我的考试</Link>
                {user.role === 'teacher' || user.role === 'admin' ? (
                  <>
                    <Link href="/teacher/exams" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">我创建的试卷</Link>
                    <Link href="/teacher/questions" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">题库</Link>
                  </>
                ) : null}
              </div>
            </div>

            {/* 学习统计 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">学习统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">已学单词</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">掌握单词</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">今日学习</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">连续天数</div>
                </div>
              </div>
            </div>

            {/* 今日推荐 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">今日推荐</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">今日单词</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">开始学习今天的10个新单词</p>
                  <button className="mt-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600">
                    开始学习
                  </button>
                </div>
                <div className="border-l-4 border-green-500 dark:border-green-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">复习提醒</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">复习之前学过的单词</p>
                  <button className="mt-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-700 dark:hover:bg-green-600">
                    开始复习
                  </button>
                </div>
              </div>
            </div>

            {/* 学习进度 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">学习进度</h3>
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
                  <div className="text-xs text-gray-600 mt-1">
                    {user.points % 100}/100 积分到下一级
                  </div>
                </div>
              </div>
            </div>

            {/* 推荐考试列表 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">推荐考试</h3>
                <Link href="/exams?list=public" className="text-blue-600 hover:underline">查看全部公开考试</Link>
              </div>
              <RecommendedExams />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendedExams() {
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
          <Link href={`/exams/${e.id}/take`} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">进入</Link>
        </li>
      ))}
    </ul>
  );
}