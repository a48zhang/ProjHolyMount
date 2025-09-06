'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Tag, Space, Row, Col, message } from 'antd';
import { BookOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import PageHeader from '@/components/page-header';
import { fetchJson } from '@/lib/http';

const { Title, Text, Paragraph } = Typography;

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  points: number;
  created_at: string;
  role: string;
  plan: string;
  grade_level: string | null;
}

interface Question {
  id: number;
  type: string;
  content_json: string;
  is_active: boolean;
  created_at: string;
  author_name?: string;
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // 获取用户角色
    fetchJson<ApiResponse<UserInfo>>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.success) {
        setRole(res.data.role);
        if (res.data.role === 'teacher' || res.data.role === 'admin') {
          // 教师和管理员跳转到题库管理
          router.push('/teacher/questions');
        } else {
          // 学生和其他用户显示题库
          fetchQuestions();
        }
      }
    });
  }, [router]);

  const fetchQuestions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const data = await fetchJson<ApiResponse<Question[]>>('/api/questions?public=true');
      if (data.success) {
        setQuestions(data.data || []);
      }
    } catch (error) {
      message.error('获取题库失败');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'single_choice': '单选题',
      'multiple_choice': '多选题',
      'fill_blank': '填空题',
      'short_answer': '简答题',
      'essay': '论述题'
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'single_choice': 'blue',
      'multiple_choice': 'green',
      'fill_blank': 'orange',
      'short_answer': 'purple',
      'essay': 'red'
    };
    return colorMap[type] || 'default';
  };

  const parseContent = (contentJson: string) => {
    try {
      return JSON.parse(contentJson);
    } catch {
      return { question: '题目加载失败', prompt: '' };
    }
  };

  if (role === 'teacher' || role === 'admin') {
    return null; // 已重定向到教师页面
  }

  return (
    <div className="container-page">
      <PageHeader title="题库练习" />
      <div className="container-inner">
        <Card className="mb-6">
          <div className="text-center mb-6">
            <BookOutlined className="text-4xl text-blue-500 mb-2" />
            <Title level={2}>公开题库</Title>
            <Paragraph type="secondary">
              这里有丰富的练习题，帮助你巩固知识点
            </Paragraph>
          </div>
          
          <div className="text-center">
            <Link href="/practice">
              <Button type="primary" size="large" icon={<PlayCircleOutlined />}>
                开始随机练习
              </Button>
            </Link>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {questions.map((question) => {
            const content = parseContent(question.content_json);
            return (
              <Card 
                key={question.id} 
                hoverable 
                className="question-card"
                actions={[
                  <Button 
                    key="practice" 
                    type="primary" 
                    size="small"
                    onClick={() => router.push(`/practice?type=${question.type}`)}
                  >
                    练习此题型
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Tag color={getTypeColor(question.type)}>
                        {getTypeLabel(question.type)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div className="space-y-2">
                      <Text className="block">
                        <span className="line-clamp-2">{content.question || content.prompt}</span>
                      </Text>
                      <Text type="secondary" className="text-xs">
                        添加时间: {new Date(question.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  }
                />
              </Card>
            );
          })}
        </div>

        {questions.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOutlined className="text-6xl text-gray-300 mb-4" />
            <Title level={3} type="secondary">
              暂无公开题目
            </Title>
            <Paragraph type="secondary">
              请稍后再来查看，或联系老师添加题目
            </Paragraph>
          </div>
        )}
      </div>
    </div>
  );
}