import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface LoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请填写用户名和密码' },
        { status: 400 }
      );
    }

    // 获取JWT密钥
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: '系统配置错误' },
        { status: 500 }
      );
    }

    // 查找用户
    const user = await env.DB
      .prepare('SELECT id, username, email, password_hash, display_name, level, points FROM users WHERE username = ?')
      .bind(username.toLowerCase())
      .first<{ id: number; username: string; email: string; password_hash: string; display_name: string; level: number; points: number }>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 返回用户信息（不包含密码）
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      level: user.level,
      points: user.points
    };

    // 便捷：附带 role/plan/grade_level（仅增加字段，不影响兼容）
    const roleRow = await env.DB
      .prepare('SELECT role FROM user_roles WHERE user_id = ?')
      .bind(user.id)
      .first<{ role: 'student' | 'teacher' | 'admin' }>();
    const profileRow = await env.DB
      .prepare('SELECT plan, grade_level FROM user_profile WHERE user_id = ?')
      .bind(user.id)
      .first<{ plan: string; grade_level: string | null }>();

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            ...userData,
            role: roleRow?.role ?? 'student',
            plan: profileRow?.plan ?? 'free',
            grade_level: profileRow?.grade_level ?? null
          }
        }
      }
    );

  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}