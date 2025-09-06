'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Form, Input, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import PageHeader from '@/components/page-header';
import { fetchJson } from '@/lib/http';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

interface LoginResponse {
  token: string;
  user: any;
}

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetchJson<ApiResponse<LoginResponse>>('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.success) {
        localStorage.setItem('token', response.data.token);
        message.success('登录成功！');
        router.push('/dashboard');
      } else {
        message.error(response.error || '登录失败');
      }
    } catch (error) {
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page">
      <PageHeader title="登录" />
      <div className="container-inner">
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <Card>
            <div className="text-center mb-6">
              <Title level={2}>欢迎回来</Title>
              <Text type="secondary">请输入您的账号信息</Text>
            </div>
            
            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入密码"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center">
              <Space>
                <Text type="secondary">还没有账号？</Text>
                <Link href="/register" className="no-underline">
                  立即注册
                </Link>
              </Space>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}