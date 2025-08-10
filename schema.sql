-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    translation TEXT,
    pronunciation TEXT,
    example_sentence TEXT,
    learned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_mastered BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_learning_records_user_id ON learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_word ON learning_records(word);
CREATE INDEX IF NOT EXISTS idx_learning_records_next_review ON learning_records(next_review);

-- =============================
-- 简化考试与权限所需新增表
-- 说明：仅新增，不修改既有表，保持向后兼容
-- =============================

-- 用户角色（单角色简化）
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'student',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户档案（权益：套餐/学段）
CREATE TABLE IF NOT EXISTS user_profile (
    user_id INTEGER PRIMARY KEY,
    plan TEXT NOT NULL DEFAULT 'free',
    grade_level TEXT,
    plan_expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 题库
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    content_json TEXT NOT NULL,
    answer_key_json TEXT,
    rubric_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 试卷
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    author_id INTEGER NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- draft|published|closed
    start_at DATETIME,
    end_at DATETIME,
    duration_minutes INTEGER,
    randomize INTEGER NOT NULL DEFAULT 0, -- 0=false,1=true
    is_public INTEGER NOT NULL DEFAULT 0,
    required_plan TEXT,
    required_grade_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 试卷题目关联
CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 发布与分配
CREATE TABLE IF NOT EXISTS exam_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_at DATETIME,
    UNIQUE (exam_id, user_id),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 学生提交
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress|submitted|graded
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    deadline_at DATETIME,
    score_auto INTEGER NOT NULL DEFAULT 0,
    score_manual INTEGER NOT NULL DEFAULT 0,
    score_total INTEGER NOT NULL DEFAULT 0,
    feedback TEXT,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 作答明细
CREATE TABLE IF NOT EXISTS submission_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    exam_question_id INTEGER NOT NULL,
    answer_json TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    is_auto_scored INTEGER NOT NULL DEFAULT 0,
    UNIQUE (submission_id, exam_question_id),
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_questions_author ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_exams_author ON exams(author_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_user ON exam_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_submission ON submission_answers(submission_id);