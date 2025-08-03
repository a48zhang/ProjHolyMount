import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
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
      .prepare('SELECT id, username, email, display_name, level, points, created_at FROM users WHERE id = ?')
      .bind(decoded.userId)
      .first<{ id: number; username: string; email: string; display_name: string; level: number; points: number; created_at: string }>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user
      }
    );

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
}