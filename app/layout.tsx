import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import 'antd/dist/reset.css';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import AppNav from '@/components/app-nav';

export const metadata: Metadata = {
  title: '英语学习平台',
  description: '中文英语学习网站',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeProvider>
          <Suspense fallback={
            <div className="h-16 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"></div>
          }>
            <AppNav />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
