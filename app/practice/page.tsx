'use client';

import { useEffect, useState } from 'react';
import { message, Select, Button, Card, Typography, Tag, Spin, Result, Row, Col, Radio, Checkbox, Input } from 'antd';
import { BookOutlined, ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import PageHeader from '@/components/page-header';
import { fetchJson } from '@/lib/http';

const { Title, Text, Paragraph } = Typography;

interface QuestionContent {
    question: string;
    options?: string[];
    [key: string]: unknown;
}

type PracticeItem = {
    question_id: number;
    type: string;
    schema_version: number;
    content: QuestionContent;
};

const QUESTION_TYPES = [
    { value: 'single_choice', label: '单选题' },
    { value: 'multiple_choice', label: '多选题' },
    { value: 'fill_blank', label: '填空题' },
    { value: 'short_answer', label: '简答题' },
    { value: 'essay', label: '论述题' },
];

export default function PracticePage() {
    const [items, setItems] = useState<PracticeItem[]>([]);
    const [answers, setAnswers] = useState<Record<number, string | string[] | string[][]>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<null | {
        results: Array<{ question_id: number; correct: boolean; score_unit: number; answer_key: unknown }>;
        correct_count: number;
        total: number;
    }>(null);
    const [lastParams, setLastParams] = useState<{ count: number; type?: string | null }>({ count: 10 });
    const [questionType, setQuestionType] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState<number>(10);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        fetchPracticeQuestions();
    }, [lastParams]);

    const fetchPracticeQuestions = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.set('count', String(lastParams.count || 10));
            if (lastParams.type) qs.set('type', lastParams.type);
            
            const data = await fetchJson<{ success: boolean; data: { items: PracticeItem[] }; error?: string }>(`/api/practice/paper?${qs.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!data.success) throw new Error(data.error || '获取失败');
            setItems(data.data.items || []);
        } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : '加载失败');
        } finally {
            setLoading(false);
        }
    };

    const startPractice = () => {
        setLastParams({ count: questionCount, type: questionType });
        setResult(null);
        setAnswers({});
    };

    const submit = async () => {
        const token = localStorage.getItem('token');
        if (!token || submitting) return;
        
        setSubmitting(true);
        try {
            const payload = {
                items: items.map(it => ({ question_id: it.question_id, answer: answers[it.question_id] }))
            };
            
            const data = await fetchJson<{ success: boolean; data: { results: Array<{ question_id: number; correct: boolean; score_unit: number; answer_key: unknown }>; correct_count: number; total: number }; error?: string }>('/api/practice/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!data.success) throw new Error(data.error || '提交失败');
            setResult(data.data);
        } catch (error: unknown) {
            message.error(error instanceof Error ? error.message : '提交失败');
        } finally {
            setSubmitting(false);
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

    if (loading) {
        return (
            <div className="container-page">
                <Spin size="large" className="flex justify-center items-center h-64" />
            </div>
        );
    }

    return (
        <div className="container-page">
            <PageHeader title="题库练习" />
            <div className="container-inner max-w-4xl space-y-6">
                {!result ? (
                    <>
                        <Card className="mb-6">
                            <div className="text-center mb-4">
                                <BookOutlined className="text-4xl text-blue-500 mb-2" />
                                <Title level={3}>题库练习</Title>
                                <Paragraph type="secondary">
                                    随时随地练习题目，提升你的知识水平
                                </Paragraph>
                            </div>
                            <div className="space-y-4">
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <div>
                                            <Text className="block mb-2">题目类型</Text>
                                            <Select
                                                placeholder="全部题型"
                                                allowClear
                                                style={{ width: '100%' }}
                                                value={questionType}
                                                onChange={setQuestionType}
                                                options={QUESTION_TYPES}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <div>
                                            <Text className="block mb-2">题目数量</Text>
                                            <Select
                                                style={{ width: '100%' }}
                                                value={questionCount}
                                                onChange={setQuestionCount}
                                                options={[
                                                    { value: 5, label: '5题' },
                                                    { value: 10, label: '10题' },
                                                    { value: 15, label: '15题' },
                                                    { value: 20, label: '20题' },
                                                ]}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <div className="text-center">
                                    <Button type="primary" size="large" onClick={startPractice} icon={<ReloadOutlined />}>
                                        开始练习
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {items.length > 0 && (
                            <>
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <Card key={item.question_id}>
                                            <div className="card-body">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-sm text-gray-600">第 {index + 1} 题</span>
                                                    <Tag color={getTypeColor(item.type)}>{getTypeLabel(item.type)}</Tag>
                                                </div>
                                                <QuestionRenderer 
                                                    item={item} 
                                                    value={answers[item.question_id]} 
                                                    onChange={(v: any) => setAnswers(prev => ({ ...prev, [item.question_id]: v }))} 
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <div className="flex justify-center">
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        onClick={submit} 
                                        loading={submitting}
                                        disabled={items.length === 0}
                                    >
                                        提交答案
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <ResultView 
                        items={items} 
                        result={result} 
                        onRetrySame={() => {
                            setResult(null);
                            setAnswers({});
                            fetchPracticeQuestions();
                        }} 
                        onRetryWrong={() => {
                            const wrongIds = new Set(result.results.filter(r => !r.correct).map(r => r.question_id));
                            const filtered = items.filter(it => wrongIds.has(it.question_id));
                            setItems(filtered);
                            setAnswers({});
                            setResult(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function QuestionRenderer({ item, value, onChange }: { item: PracticeItem; value: string | string[] | string[][] | undefined; onChange: (v: string | string[] | string[][]) => void }) {
    const { type, content } = item;
    
    if (type === 'single_choice') {
        const options: string[] = content?.options || [];
        return (
            <div className="space-y-3">
                <div className="font-medium">{String(content?.question || '')}</div>
                <Radio.Group 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="space-y-2"
                >
                    {options.map((option, index) => (
                        <Radio key={index} value={String(option)}>
                            {String(option || '')}
                        </Radio>
                    ))}
                </Radio.Group>
            </div>
        );
    }
    
    if (type === 'multiple_choice') {
        const options: string[] = content?.options || [];
        const currentValues = (Array.isArray(value) && value.every(v => typeof v === 'string')) ? value as string[] : [];
        
        const handleChange = (checkedValue: string) => {
            const newValues = currentValues.includes(checkedValue)
                ? currentValues.filter(v => v !== checkedValue)
                : [...currentValues, checkedValue];
            onChange(newValues.sort());
        };
        
        return (
            <div className="space-y-3">
                <div className="font-medium">{String(content?.question || '')}</div>
                <Checkbox.Group 
                    value={currentValues}
                    className="space-y-2"
                >
                    {options.map((option, index) => (
                        <Checkbox 
                            key={index} 
                            value={String(option)}
                            onChange={() => handleChange(String(option))}
                        >
                            {String(option || '')}
                        </Checkbox>
                    ))}
                </Checkbox.Group>
            </div>
        );
    }
    
    if (type === 'fill_blank') {
        const blanks: number = (typeof content?.blanks === 'number') ? content.blanks : (Array.isArray(content?.blanks) ? content.blanks.length : 0);
        const currentValues = (Array.isArray(value) && value.every(v => typeof v === 'string')) ? value as string[] : Array.from({ length: blanks }, () => '');
        
        const handleChange = (index: number, newValue: string) => {
            const newValues = [...currentValues];
            newValues[index] = newValue;
            onChange(newValues);
        };
        
        return (
            <div className="space-y-3">
                <div className="font-medium">{String(content?.question || '')}</div>
                <div className="space-y-2">
                    {Array.from({ length: blanks }).map((_, index) => (
                        <Input
                            key={index}
                            value={currentValues[index] || ''}
                            onChange={(e) => handleChange(index, e.target.value)}
                            placeholder={`填空 ${index + 1}`}
                            className="max-w-xs"
                        />
                    ))}
                </div>
            </div>
        );
    }
    
    if (type === 'short_answer' || type === 'essay') {
        const stringValue = typeof value === 'string' ? value : '';
        return (
            <div className="space-y-3">
                <div className="font-medium">{String(content?.prompt || '')}</div>
                <Input.TextArea
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="请输入你的答案..."
                    rows={type === 'essay' ? 6 : 3}
                    className="max-w-lg"
                />
            </div>
        );
    }
    
    return <div className="text-gray-500">暂不支持的题型：{type}</div>;
}

function ResultView({ items, result, onRetrySame, onRetryWrong }: { 
    items: PracticeItem[]; 
    result: { results: Array<{ question_id: number; correct: boolean; score_unit: number; answer_key: any }>; correct_count: number; total: number }; 
    onRetrySame: () => void; 
    onRetryWrong: () => void; 
}) {
    const resultMap = new Map(result.results.map(r => [r.question_id, r]));
    const accuracy = Math.round((result.correct_count / result.total) * 100);
    
    return (
        <div className="space-y-6">
            <Card>
                <Result
                    status={accuracy >= 80 ? 'success' : accuracy >= 60 ? 'info' : 'warning'}
                    title={`练习完成！得分：${accuracy}%`}
                    subTitle={`答对了 ${result.correct_count} 题，共 ${result.total} 题`}
                    extra={[
                        <Button key="retry" onClick={onRetrySame} icon={<ReloadOutlined />}>
                            再来一组
                        </Button>,
                        result.correct_count < result.total && (
                            <Button key="wrong" type="primary" onClick={onRetryWrong}>
                                错题重练
                            </Button>
                        )
                    ].filter(Boolean)}
                />
            </Card>
            
            <div className="space-y-4">
                {items.map((item, index) => {
                    const resultInfo = resultMap.get(item.question_id);
                    const isCorrect = resultInfo?.correct;
                    
                    return (
                        <Card key={item.question_id}>
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-sm text-gray-600">第 {index + 1} 题</span>
                                    <Tag color={isCorrect ? 'green' : 'red'}>
                                        {isCorrect ? <CheckOutlined /> : <CloseOutlined />}
                                        {isCorrect ? '正确' : '错误'}
                                    </Tag>
                                </div>
                                <QuestionSolution 
                                    item={item} 
                                    answerKey={resultInfo?.answer_key}
                                />
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function QuestionSolution({ item, answerKey }: { item: PracticeItem; answerKey: any }) {
    const { type, content } = item;
    
    const formatAnswerKey = (key: any, type: string) => {
        if (!key) return '无参考答案';
        
        switch (type) {
            case 'single_choice':
                const options: string[] = content?.options || [];
                return String(options[key] || key);
            case 'multiple_choice':
                const multiOptions: string[] = content?.options || [];
                return Array.isArray(key) 
                    ? key.map((k: number) => String(multiOptions[k] || k)).join(', ')
                    : String(key);
            case 'fill_blank':
                return Array.isArray(key) ? key.join(' | ') : String(key);
            default:
                return String(key);
        }
    };
    
    return (
        <div className="space-y-3">
            {type === 'single_choice' && (
                <>
                    <div className="font-medium">{String(content?.question || '')}</div>
                    <div className="space-y-1">
                        {(content?.options || []).map((option: string, index: number) => (
                            <div key={index} className="text-sm">
                                {index}. {String(option || '')}
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {type === 'multiple_choice' && (
                <>
                    <div className="font-medium">{String(content?.question || '')}</div>
                    <div className="space-y-1">
                        {(content?.options || []).map((option: string, index: number) => (
                            <div key={index} className="text-sm">
                                {index}. {String(option || '')}
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {type === 'fill_blank' && (
                <>
                    <div className="font-medium">{String(content?.question || '')}</div>
                </>
            )}
            
            {(type === 'short_answer' || type === 'essay') && (
                <>
                    <div className="font-medium">{String(content?.prompt || '')}</div>
                </>
            )}
            
            <div className="bg-gray-50 p-3 rounded">
                <Text type="secondary" className="text-sm">
                    <strong>参考答案：</strong>{formatAnswerKey(answerKey, type)}
                </Text>
            </div>
        </div>
    );
}