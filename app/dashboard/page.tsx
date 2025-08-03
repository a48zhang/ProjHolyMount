'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';


interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  level: number;
  points: number;
  created_at: string;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* 导航栏 */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">英语学习平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">欢迎, {user.display_name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速操作</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
                  📚 开始学习
                </button>
                <button className="w-full text-left px-4 py-2 text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/50">
                  📝 查看记录
                </button>
                <button className="w-full text-left px-4 py-2 text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50">
                  📊 学习统计
                </button>
              </div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="md:col-span-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}