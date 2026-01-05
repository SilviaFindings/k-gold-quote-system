import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "请提供邮箱地址" },
        { status: 400 }
      );
    }

    // 这里应该：
    // 1. 验证邮箱是否存在
    // 2. 生成重置 token
    // 3. 保存 token 到数据库
    // 4. 发送重置邮件

    // 临时方案：返回成功消息（实际应该发送邮件）
    // 重置链接格式：https://yourdomain.com/reset-password?token=xxx

    console.log(`重置密码请求：${email}`);

    // TODO: 实现邮件发送功能
    // 需要集成邮件服务（如 integration-agent-mail）
    // 或者使用数据库集成来存储重置 token

    return NextResponse.json({
      message: "重置密码邮件已发送",
      // 测试环境下返回 token（生产环境应该通过邮件发送）
      // resetLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=test-token`
    });
  } catch (error) {
    console.error("忘记密码错误:", error);
    return NextResponse.json(
      { error: "处理请求时出错" },
      { status: 500 }
    );
  }
}
