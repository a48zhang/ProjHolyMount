'use client';

import { Suspense } from 'react';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8">英语学习平台</h1>
          <p className="text-center text-lg">欢迎使用我们的在线考试系统</p>
        </main>
      </div>
    </Suspense>
  );
}
