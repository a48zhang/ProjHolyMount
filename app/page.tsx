'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, Button, Form, Input, Typography, Space, Row, Col, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EditOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    setShowLogin(true);
  };

  const handleRegister = () => {
    setShowRegister(true);
  };

  const handleGuest = () => {
    router.push('/dashboard');
  };

  if (showLogin) {
    return <LoginForm onBack={() => setShowLogin(false)} />;
  }

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <Title level={1} style={{ fontSize: '3rem', marginBottom: 16 }}>
            英语学习平台
          </Title>
          <Paragraph style={{ fontSize: '1.25rem', marginBottom: 32 }}>
            开启你的英语学习之旅，每天进步一点点
          </Paragraph>
        </div>

        <Card style={{ padding: '2rem', marginBottom: 32 }}>
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} md={8}>
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📚</span>
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>词汇学习</Title>
                <Text type="secondary">循序渐进的词汇积累</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>个性学习</Title>
                <Text type="secondary">根据你的水平定制内容</Text>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>学习追踪</Title>
                <Text type="secondary">记录你的学习进度</Text>
              </div>
            </Col>
          </Row>

          <Space size="large" wrap>
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              style={{ minWidth: 120 }}
            >
              登录账号
            </Button>
            <Button
              size="large"
              icon={<UserAddOutlined />}
              onClick={handleRegister}
              style={{ minWidth: 120, backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
            >
              注册新账号
            </Button>
            <Button
              size="large"
              onClick={handleGuest}
              style={{ minWidth: 120 }}
            >
              游客访问
            </Button>
          </Space>
        </Card>

        <Text type="secondary">
          已有 1000+ 用户在这里提升了英语水平
        </Text>
      </div>
    </div>
  );
}

function LoginForm({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json() as { success: boolean; data: { token: string }; error?: string };

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        message.success('登录成功！');
        router.push('/dashboard');
      } else {
        message.error(data.error || '登录失败');
      }
    } catch (err) {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          登录账号
        </Title>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
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
              size="large"
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <Button
          type="link"
          onClick={onBack}
          block
        >
          返回
        </Button>
      </Card>
    </div>
  );
}

function RegisterForm({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const handleSubmit = async (values: {
    username: string;
    email: string;
    password: string;
    display_name?: string;
  }) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json() as { success: boolean; data: { username: string; email: string; display_name: string }; error?: string };

      if (data.success) {
        message.success('注册成功！正在自动登录...');
        // 注册成功后自动登录
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: values.username,
            password: values.password,
          }),
        });

        const loginData = await loginResponse.json() as { success: boolean; data: { token: string }; error?: string };
        if (loginData.success) {
          localStorage.setItem('token', loginData.data.token);
          router.push('/dashboard');
        }
      } else {
        message.error(data.error || '注册失败');
      }
    } catch (err) {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          注册新账号
        </Title>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名不能超过50个字符' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和破折号' }
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
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="请输入邮箱" 
            />
          </Form.Item>

          <Form.Item
            name="display_name"
            label="显示名称"
            rules={[
              { max: 100, message: '显示名称不能超过100个字符' }
            ]}
          >
            <Input 
              prefix={<EditOutlined />} 
              placeholder="请输入显示名称（可选）" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 128, message: '密码不能超过128个字符' }
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
              size="large"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </Form.Item>
        </Form>

        <Button
          type="link"
          onClick={onBack}
          block
        >
          返回
        </Button>
      </Card>
    </div>
  );
}
