import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/repositories/UserRepository";
import { UpdateProgressRequest } from "@/types/api";

const userRepository = new UserRepository();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { progress }: UpdateProgressRequest = await request.json();

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "进度值必须是0-100之间的数字" },
        { status: 400 }
      );
    }

    const user = await userRepository.updateProgress(id, progress);
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
    console.error("Update progress error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}