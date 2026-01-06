import { NextRequest, NextResponse } from "next/server";
import { getDb } from "coze-coding-dev-sdk";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { getSession } from "@/app/api/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const { dataClearPassword } = await req.json();

    if (!dataClearPassword) {
      return NextResponse.json(
        { error: "请提供数据清空密码" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查是否设置了数据清空密码
    if (!user.dataClearPassword) {
      return NextResponse.json(
        { error: "未设置数据清空密码，请先设置" },
        { status: 400 }
      );
    }

    // 验证数据清空密码
    const passwordMatch = await bcrypt.compare(dataClearPassword, user.dataClearPassword);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "数据清空密码不正确" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "验证成功",
      valid: true,
    });
  } catch (error) {
    console.error("验证数据清空密码错误:", error);
    return NextResponse.json(
      { error: "验证失败" },
      { status: 500 }
    );
  }
}
