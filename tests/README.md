# 测试列表

## API测试
- **exams_list_create.test.ts** - 考试列表和创建
- **exams_paper.test.ts** - 获取考试试卷
- **exams_questions.test.ts** - 考试题目管理
- **exams_questions_bulk.test.ts** - 批量题目操作
- **exams_start.test.ts** - 开始考试
- **exams_start_negative.test.ts** - 考试开始负向测试
- **exams_start_plan_grade_negative.test.ts** - 权限限制测试
- **exams_close_assign_public_detail.test.ts** - 考试关闭/分配/详情
- **exams_update_assignments_list.test.ts** - 更新考试分配
- **questions_create.test.ts** - 创建题目
- **questions_crud.test.ts** - 题目CRUD操作
- **me_and_users.test.ts** - 用户和认证
- **submission_answers.test.ts** - 答案提交
- **submission_status_detail.test.ts** - 提交状态详情
- **submission_submit.test.ts** - 提交处理

## 前端工具测试
- **lib/auth.test.ts** - 认证工具
- **lib/http.test.ts** - HTTP工具
- **lib/sanitize.test.ts** - HTML清理
- **utils/date-utils.test.ts** - 日期工具
- **utils/score-calculation.test.ts** - 分数计算
- **utils/storage.test.ts** - 本地存储
- **utils/validation.test.ts** - 表单验证

## 组件测试
- **components/empty-state.test.ts** - 空状态组件
- **components/page-header.test.ts** - 页面头部
- **components/question-editor-helpers.test.ts** - 题目编辑器助手
- **components/question-helpers.test.ts** - 题目显示助手