import { NextRequest, NextResponse } from "next/server";
import { passwordResetManager } from "@/storage/database/passwordResetManager";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "请提供邮箱地址" },
        { status: 400 }
      );
    }

    // 生成重置 token
    const result = await passwordResetManager.createResetToken(email);

    if (result) {
      console.log(`重置密码请求：${email}`);
      console.log(`重置链接：${result.resetUrl}`);

      // TODO: 发送重置邮件
      // 当前没有邮件集成，需要在生产环境中集成邮件服务
      // 临时方案：将重置链接返回给用户（仅用于开发/测试）

      return NextResponse.json({
        message: "重置密码邮件已发送",
        // 开发环境返回重置链接，生产环境应该通过邮件发送
        resetUrl: process.env.NODE_ENV === 'development' ? result.resetUrl : undefined,
      });
    }

    // 即使用户不存在，也返回成功消息（避免邮箱枚举攻击）
    return NextResponse.json({
      message: "重置密码邮件已发送",
    });
  } catch (error: any) {
    console.error("忘记密码错误:", error);
    console.error("错误详情:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
    return NextResponse.json(
      { error: "处理请求时出错" },
      { status: 500 }
    );
  }
}
