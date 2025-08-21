import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/UserRepository";
import { LoginRequest } from "@/types/user";

const userRepository = new UserRepository();

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码都是必填项" },
        { status: 400 }
      );
    }

    // 验证用户凭据
    const user = await userRepository.validatePassword(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}