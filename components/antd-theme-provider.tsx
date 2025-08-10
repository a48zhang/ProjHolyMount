'use client';

import React, { useEffect, useState } from 'react';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

export default function AntdThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const updateThemeFromDom = () => {
            const hasDark = document.documentElement.classList.contains('dark');
            setIsDark(hasDark);
            document.documentElement.style.colorScheme = hasDark ? 'dark' : 'light';
        };
        updateThemeFromDom();
        const observer = new MutationObserver(updateThemeFromDom);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: isDark ? '#60a5fa' : '#1677ff',
                },
            }}
        >
            <AntdApp>{children}</AntdApp>
        </ConfigProvider>
    );
}


