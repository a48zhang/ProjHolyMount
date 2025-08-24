'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Form, Input, InputNumber, Switch, Button, message, Table, Space, Drawer, Input as AntInput, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { fetchJson, authHeaders } from '@/lib/http';

export default function EditExamPage() {
    const { id } = useParams<{ id: string }>();
    const examId = Number(id);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<any[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [pointsMap, setPointsMap] = useState<Record<number, number>>({});
    const [questionList, setQuestionList] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !Number.isFinite(examId)) return;
        Promise.all([
            fetchJson<any>(`/api/exams/${examId}`, { headers: authHeaders(token, false) }),
            fetchJson<any>(`/api/exams/${examId}/questions`, { headers: authHeaders(token, false) }),
        ]).then(([exam, eqs]) => {
            if (exam.success) {
                form.setFieldsValue({
                    title: exam.data.title,
                    description: exam.data.description,
                    duration_minutes: exam.data.duration_minutes,
                    randomize: !!exam.data.randomize,
                    required_plan: exam.data.required_plan,
                    required_grade_level: exam.data.required_grade_level,
                });
            }
            if (eqs.success) {
                const list = eqs.data.items || [];
                setRows(list);
                const pm: Record<number, number> = {};
                list.forEach((it: any) => { pm[it.question_id] = it.points || 0; });
                setPointsMap(pm);
            }
        }).finally(() => setLoading(false));
    }, [examId, form]);

    const saveDraft = async () => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        const v = await form.validateFields();
        const res = await fetchJson<any>(`/api/exams/${examId}`, {
            method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({
                title: v.title,
                description: v.description ?? null,
                duration_minutes: v.duration_minutes ?? null,
                randomize: !!v.randomize,
                is_public: v.is_public ? 1 : 0,
                required_plan: v.required_plan ?? null,
                required_grade_level: v.required_grade_level ?? null,
            })
        });
        if (res.success) message.success('已保存'); else message.error(res.error || '保存失败');
    };

    const columns: ColumnsType<any> = [
        { title: '序号', dataIndex: 'order_index', width: 90 },
        { title: '题目ID', dataIndex: 'question_id', width: 120 },
        { title: '类型', dataIndex: ['question', 'type'], width: 160 },
        {
            title: '分值', dataIndex: 'points', width: 140, render: (v, r) => (
                <InputNumber min={0} value={pointsMap[r.question_id] ?? v} onChange={(val) => setPointsMap(m => ({ ...m, [r.question_id]: Number(val || 0) }))} />
            )
        }
    ];

    const moveRow = (idx: number, delta: number) => {
        setRows(list => {
            const arr = [...list];
            const ni = idx + delta;
            if (ni < 0 || ni >= arr.length) return arr;
            const [cur] = arr.splice(idx, 1);
            arr.splice(ni, 0, cur);
            return arr.map((it, i) => ({ ...it, order_index: i + 1 }));
        });
    };
    const removeRow = (idx: number) => {
        setRows(list => list.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order_index: i + 1 })));
    };

    const openQuestionPicker = async () => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        setPickerOpen(true);
        const res = await fetchJson<any>(`/api/questions?limit=100&offset=0&includeContent=false`, { headers: authHeaders(token, false) });
        if (res.success) setQuestionList(res.data || []);
        else message.error(res.error || '加载题库失败');
    };


    const saveExamQuestions = async () => {
        const token = localStorage.getItem('token');
        if (!token) return message.error('未登录');
        const items = rows.map((r, i) => ({ question_id: r.question_id, order_index: i + 1, points: Number(r.points || 0) }));
        const res = await fetchJson<any>(`/api/exams/${examId}/questions/bulk`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ items }) });
        if (res.success) message.success('已保存题目设置'); else message.error(res.error || '保存失败');
    };

    return (
        <div className="container-page">
            <div className="container-inner max-w-5xl space-y-4">
                <div className="card"><div className="card-body">
                    <h1 className="card-title">编辑试卷 #{examId}</h1>
                    <Form form={form} layout="vertical">
                        <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
                        <Form.Item name="duration_minutes" label="时长（分钟）"><InputNumber min={0} className="w-full" /></Form.Item>
                        <Form.Item name="randomize" label="题目乱序" valuePropName="checked"><Switch /></Form.Item>
                        <Form.Item name="is_public" label="公开试卷" valuePropName="checked"><Switch /></Form.Item>
                        <Form.Item name="required_plan" label="套餐要求"><Input placeholder="free/premium 或留空" /></Form.Item>
                        <Form.Item name="required_grade_level" label="学段要求"><Input placeholder="如 primary/junior/senior/college 或留空" /></Form.Item>
                        <Space>
                            <Button type="primary" onClick={saveDraft}>保存基本信息</Button>
                            <Button onClick={openQuestionPicker}>添加题目</Button>
                            <Button onClick={saveExamQuestions}>保存题目设置</Button>
                            <Button onClick={() => window.open(`/teacher/exams/${examId}/preview`, '_blank')}>学生视图预览</Button>
                        </Space>
                    </Form>
                </div></div>

                <div className="card"><div className="card-body">
                    <h2 className="card-title">题目列表</h2>
                    <Space className="mb-3">
                        <Button onClick={() => setPickerOpen(true)}>添加题目</Button>
                        <Button onClick={async () => {
                            // 保存 bulk
                            const token = localStorage.getItem('token');
                            if (!token) return message.error('未登录');
                            const items = rows.map((it, idx) => ({ question_id: it.question_id, order_index: idx + 1, points: pointsMap[it.question_id] ?? it.points ?? 0 }));
                            const res = await fetchJson<any>(`/api/exams/${examId}/questions/bulk`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ items }) });
                            if (res.success) message.success('已保存题目列表'); else message.error(res.error || '保存失败');
                        }}>保存题目列表</Button>
                        <Button onClick={() => message.info('即将支持拖拽排序')}>拖拽排序（待实现）</Button>
                        <Button type="primary" onClick={() => location.href = `/teacher/exams/${examId}/publish`}>去发布</Button>
                    </Space>
                    <Table rowKey="exam_question_id" columns={columns} dataSource={rows} pagination={false} />
                </div></div>

                <Drawer open={pickerOpen} onClose={() => setPickerOpen(false)} title="选择题目" width={720}>
                    <QuestionPicker selected={selectedIds} onChangeSelected={setSelectedIds} onConfirm={async (picked) => {
                        const existing = new Set(rows.map(r => r.question_id));
                        const merged = [...rows];
                        picked.forEach((qid) => { if (!existing.has(qid)) merged.push({ exam_question_id: `tmp-${qid}`, question_id: qid, order_index: merged.length + 1, points: pointsMap[qid] ?? 0, question: { type: 'unknown' } }); });
                        setRows(merged);
                        setPickerOpen(false);
                    }} />
                </Drawer>
            </div>
        </div>
    );
}

function QuestionPicker({ selected, onChangeSelected, onConfirm }: { selected: number[]; onChangeSelected: (v: number[]) => void; onConfirm: (picked: number[]) => void; }) {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState<string | undefined>(undefined);
    const [q, setQ] = useState('');
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        params.set('includeContent', 'true');
        fetch(`/api/questions?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json() as Promise<any>)
            .then(res => {
                if (res.success) {
                    const list = (res.data || []) as any[];
                    const filtered = q ? list.filter(it => JSON.stringify(it.content_json ?? {}).includes(q)) : list;
                    setRows(filtered);
                }
            })
            .finally(() => setLoading(false));
    }, [type, q]);
    const cols: ColumnsType<any> = [
        { title: '题目ID', dataIndex: 'id', width: 120 },
        { title: '类型', dataIndex: 'type', width: 160 },
        { title: '内容', dataIndex: 'content_json', render: (v) => (v?.stem || v?.text || v?.prompt || '').slice(0, 40) },
    ];
    return (
        <div className="space-y-3">
            <Space>
                <AntInput allowClear placeholder="搜索题干/内容" value={q} onChange={e => setQ(e.target.value)} />
                <Select allowClear placeholder="按题型过滤" style={{ width: 200 }} value={type} onChange={setType as any}
                    options={[
                        { value: 'single_choice', label: '单选题' },
                        { value: 'multiple_choice', label: '多选题' },
                        { value: 'fill_blank', label: '填空题' },
                        { value: 'short_answer', label: '简答题' },
                        { value: 'essay', label: '论述题' },
                    ]}
                />
            </Space>
            <Table
                rowKey="id"
                loading={loading}
                columns={cols}
                dataSource={rows}
                rowSelection={{
                    selectedRowKeys: selected,
                    onChange: (keys) => onChangeSelected(keys as number[])
                }}
                pagination={{ pageSize: 10 }}
            />
            <Space>
                <Button onClick={() => onConfirm(selected)} type="primary">加入所选</Button>
            </Space>
        </div>
    );
}



