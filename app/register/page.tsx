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

interface RegisterResponse {
  token: string;
  user: any;
}

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchJson<ApiResponse<RegisterResponse>>('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      if (response.success) {
        message.success('注册成功！请登录');
        router.push('/login');
      } else {
        message.error(response.error || '注册失败');
      }
    } catch (error) {
      message.error('注册失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page">
      <PageHeader title="注册" />
      <div className="container-inner">
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <Card>
            <div className="text-center mb-6">
              <Title level={2}>创建账号</Title>
              <Text type="secondary">欢迎加入我们的学习平台</Text>
            </div>
            
            <Form
              name="register"
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
                  { max: 20, message: '用户名最多20个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入用户名"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱地址"
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

              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请再次输入密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请再次输入密码"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                >
                  注册
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center">
              <Space>
                <Text type="secondary">已有账号？</Text>
                <Link href="/login" className="no-underline">
                  立即登录
                </Link>
              </Space>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}