import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "antd/dist/reset.css";
import zhCN from 'antd/locale/zh_CN';
import { ConfigProvider, App as AntdApp } from 'antd';
import "./globals.css";
import AppNav from '@/components/app-nav';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "英语学习平台",
  description: "中文英语学习网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
          <AntdApp>
            <AppNav />
            {children}
          </AntdApp>
        </ConfigProvider>
      </body>
    </html>
  );
}
