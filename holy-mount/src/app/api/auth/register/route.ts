import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/UserRepository";
import { RegisterRequest } from "@/types/user";

const userRepository = new UserRepository();

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "所有字段都是必填项" },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6个字符" },
        { status: 400 }
      );
    }

    // 创建用户
    const user = await userRepository.createUser({ name, email, password });

    return NextResponse.json({
      success: true,
      user
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    
    // 处理已知错误
    if (error instanceof Error) {
      if (error.message.includes("邮箱")) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}