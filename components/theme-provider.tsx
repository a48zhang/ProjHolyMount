'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    mode: ThemeMode;
    isDark: boolean; // resolved
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'system',
    isDark: false,
    setTheme: () => { },
});

function getPreferredDark(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyDomTheme(isDark: boolean) {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('system');
    const [isDark, setIsDark] = useState(false);

    // Initialize mode from storage once
    useEffect(() => {
        try {
            const stored = localStorage.getItem('theme') as ThemeMode | null;
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                setMode(stored);
            } else {
                setMode('system');
            }
        } catch {
            setMode('system');
        }
    }, []);

    // Resolve and apply theme
    useEffect(() => {
        const compute = () => {
            const resolvedDark = mode === 'system' ? getPreferredDark() : mode === 'dark';
            setIsDark(resolvedDark);
            applyDomTheme(resolvedDark);
        };

        compute();

        if (mode === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => compute();
            mq.addEventListener?.('change', handler);
            // Fallback for older Safari
            // @ts-ignore
            mq.addListener?.(handler);
            return () => {
                mq.removeEventListener?.('change', handler);
                // @ts-ignore
                mq.removeListener?.(handler);
            };
        }
    }, [mode]);

    const setTheme = useCallback((next: ThemeMode) => {
        setMode(next);
        try {
            localStorage.setItem('theme', next);
        } catch { }
    }, []);

    const ctxValue = useMemo<ThemeContextValue>(
        () => ({ mode, isDark, setTheme }),
        [mode, isDark, setTheme]
    );

    return (
        <ThemeContext.Provider value={ctxValue}>
            <ConfigProvider
                locale={zhCN}
                theme={{
                    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                    token: { colorPrimary: isDark ? '#60a5fa' : '#1677ff' },
                }}
            >
                <AntdApp>{children}</AntdApp>
            </ConfigProvider>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}


