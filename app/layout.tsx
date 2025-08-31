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
          <AppNav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}