import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/UserRepository";
import { AddWordsRequest } from "@/types/api";

const userRepository = new UserRepository();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { count }: AddWordsRequest = await request.json();

    if (typeof count !== "number" || count < 0) {
      return NextResponse.json(
        { error: "单词数量必须是非负数" },
        { status: 400 }
      );
    }

    const user = await userRepository.addWordsLearned(id, count);
    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Add words error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}