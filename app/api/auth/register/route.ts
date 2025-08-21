import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from 'bcryptjs';
import { withApiLogging } from '@/lib/logger';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export const POST = withApiLogging(async (request: NextRequest) => {
  try {
    const { env } = await getCloudflareContext();
    const body: RegisterRequest = await request.json();
    const { username, email, password, display_name } = body;

    // 详细输入验证
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 用户名格式验证
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: '用户名只能包含字母、数字、下划线和连字符' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { success: false, error: '用户名长度必须在3-50个字符之间' },
        { status: 400 }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { success: false, error: '邮箱地址过长' },
        { status: 400 }
      );
    }

    // 密码强度验证
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少需要6个字符' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { success: false, error: '密码过长' },
        { status: 400 }
      );
    }

    // 清理输入
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = (display_name || username).trim();

    // 获取JWT密钥
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: '系统配置错误' },
        { status: 500 }
      );
    }

    // 检查用户名和邮箱是否已存在
    const checkQuery = `
      SELECT username, email FROM users 
      WHERE LOWER(username) = ? OR LOWER(email) = ?
    `;

    const existingUser = await env.DB
      .prepare(checkQuery)
      .bind(cleanUsername, cleanEmail)
      .first<{ username: string; email: string }>();

    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername) {
        return NextResponse.json(
          { success: false, error: '用户名已被使用' },
          { status: 409 }
        );
      }
      if (existingUser.email.toLowerCase() === cleanEmail) {
        return NextResponse.json(
          { success: false, error: '邮箱已被注册' },
          { status: 409 }
        );
      }
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 12);

    // 创建用户
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, display_name, level, points, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))
    `;

    await env.DB
      .prepare(insertQuery)
      .bind(cleanUsername, cleanEmail, passwordHash, cleanDisplayName)
      .run();

    // 获取新创建的用户信息
    const newUser = await env.DB
      .prepare('SELECT id, username, email, display_name, level, points, created_at FROM users WHERE username = ?')
      .bind(cleanUsername)
      .first<{ id: number; username: string; email: string; display_name: string; level: number; points: number; created_at: string }>();

    if (!newUser) {
      return NextResponse.json(
        { success: false, error: '用户创建成功但获取信息失败' },
        { status: 500 }
      );
    }

    // 初始化角色与档案（默认 student/free）
    await env.DB.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, \"student\")').bind(newUser.id).run();
    await env.DB.prepare('INSERT OR IGNORE INTO user_profile (user_id, plan, grade_level) VALUES (?, \"free\", NULL)').bind(newUser.id).run();

    return NextResponse.json(
      {
        success: true,
        message: '注册成功',
        data: newUser
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
});