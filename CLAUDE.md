# CLAUDE.md - 开发要点记录

## 项目概况
- 中文英语学习网站
- 技术栈：Next.js 15 + React 19 + TypeScript + Cloudflare Workers/D1 + JWT认证
- 功能：用户注册/登录、个人主页、学习统计

## 开发规范与要点

### 1. 环境变量访问
**错误做法：**
```typescript
// ❌ 不要这样做
globalThis.env?.JWT_SECRET
process.env.JWT_SECRET
```

**正确做法：**
```typescript
// ✅ 使用官方集成
import { getCloudflareContext } from '@opennextjs/cloudflare';
const { env } = await getCloudflareContext();
const jwtSecret = env.JWT_SECRET;
```

### 2. 类型安全
**请求体类型定义：**
```typescript
// ✅ 始终定义请求体接口
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

const body: RegisterRequest = await request.json();
```

**D1查询类型：**
```typescript
// ✅ 明确指定查询结果类型
const user = await env.DB
  .prepare('SELECT ...')
  .bind(id)
  .first<{ id: number; username: string; ... }>();
```

### 3. Wrangler配置
**JWT_SECRET配置：**
- ❌ 不要在wrangler.jsonc中明文配置
- ✅ 使用Cloudflare Secrets：`wrangler secret put JWT_SECRET`

**数据库绑定：**
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "english-learning-db",
      "database_id": "english-learning-db"
    }
  ]
}
```

### 4. API路由规范
**统一响应格式：**
```typescript
// ✅ 成功响应
return NextResponse.json({
  success: true,
  data: userData,
  message: '操作成功'
});

// ✅ 错误响应
return NextResponse.json({
  success: false,
  error: '具体错误信息'
}, { status: 400 });
```

**HTTP状态码：**
- 200: 成功
- 201: 创建成功
- 400: 客户端错误
- 401: 未授权
- 404: 资源不存在
- 409: 冲突（如用户名已存在）
- 500: 服务器错误

### 5. 输入验证
**用户名验证：**
- 正则：`/^[a-zA-Z0-9_-]+$/`
- 长度：3-50字符
- 转小写存储

**邮箱验证：**
- 正则：`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- 长度：≤255字符
- 转小写存储

**密码验证：**
- 长度：6-128字符
- bcrypt哈希存储（salt rounds: 12）

### 6. JWT实现
**Token生成：**
```typescript
const token = jwt.sign(
  { userId, username, email },
  jwtSecret,
  { expiresIn: '7d' }
);
```

**Token验证：**
```typescript
const decoded = jwt.verify(token, jwtSecret) as {
  userId: number;
  username: string;
  email: string;
};
```

### 7. 数据库Schema
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8. 前端规范
**认证Token存储：**
- localStorage: `localStorage.setItem('token', token)`
- 请求头: `Authorization: Bearer ${token}`

**错误处理：**
- 401错误：清除token并重定向到登录页
- 网络错误：显示用户友好的错误信息

### 9. 部署命令
```bash
# 设置密钥
wrangler secret put JWT_SECRET

# 本地开发
npm run dev

# 构建
npm run build

# 部署
npm run deploy
```

### 10. 禁止事项
- ❌ 不要编造不存在的API或类型定义
- ❌ 不要使用全局变量访问环境变量
- ❌ 不要在代码中硬编码敏感信息
- ❌ 不要跳过输入验证
- ❌ 不要将密码明文存储

### 11. 中文界面规范
- 所有用户可见文本使用中文
- 日期格式：使用 `toLocaleDateString('zh-CN')`
- 错误提示：使用用户友好的中文描述