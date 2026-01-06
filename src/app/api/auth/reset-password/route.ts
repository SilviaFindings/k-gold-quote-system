import { NextRequest, NextResponse } from "next/server";
import { passwordResetManager } from "@/storage/database/passwordResetManager";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为6位" },
        { status: 400 }
      );
    }

    // 验证 token 并重置密码
    const success = await passwordResetManager.resetPassword(token, password);

    if (!success) {
      return NextResponse.json(
        { error: "重置链接无效或已过期" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "密码重置成功"
    });
  } catch (error) {
    console.error("重置密码错误:", error);
    return NextResponse.json(
      { error: "处理请求时出错" },
      { status: 500 }
    );
  }
}
