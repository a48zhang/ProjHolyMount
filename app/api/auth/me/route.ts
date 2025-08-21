import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import jwt from 'jsonwebtoken';
import { getAuthContext } from '@/lib/auth';
import { withApiLogging } from '@/lib/logger';

export const GET = withApiLogging(async (request: NextRequest) => {
  try {
    const { env } = await getCloudflareContext();

    // 获取token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证token' },
        { status: 401 }
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

    // 验证token
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: number;
      username: string;
      email: string;
    };

    // 获取用户信息
    const user = await env.DB
      .prepare('SELECT id, username, email, display_name, avatar_url, level, points, created_at FROM users WHERE id = ?')
      .bind(decoded.userId)
      .first<{ id: number; username: string; email: string; display_name: string; avatar_url: string | null; level: number; points: number; created_at: string }>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 读取简化权限信息（角色与权益）
    // 这里复用统一上下文，避免重复查询与分散实现
    const ctx = await getAuthContext(request);

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        role: ctx.role,
        plan: ctx.plan,
        grade_level: ctx.grade_level,
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: '无效的token' },
        { status: 401 }
      );
    }

    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
});