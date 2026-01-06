import { NextRequest, NextResponse } from "next/server";
import { getDb } from "coze-coding-dev-sdk";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { getSession } from "@/app/api/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const [user] = await db
      .select({ dataClearPassword: users.dataClearPassword })
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasDataClearPassword: !!user.dataClearPassword,
    });
  } catch (error) {
    console.error("获取数据清空密码状态错误:", error);
    return NextResponse.json(
      { error: "获取状态失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const { currentPassword, dataClearPassword } = await req.json();

    if (!currentPassword || !dataClearPassword) {
      return NextResponse.json(
        { error: "请提供当前密码和新数据清空密码" },
        { status: 400 }
      );
    }

    if (dataClearPassword.length < 6) {
      return NextResponse.json(
        { error: "数据清空密码长度至少为6位" },
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

    // 验证当前登录密码
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "当前密码不正确" },
        { status: 401 }
      );
    }

    // 哈希新的数据清空密码
    const hashedDataClearPassword = await bcrypt.hash(dataClearPassword, 10);

    // 更新数据清空密码
    await db
      .update(users)
      .set({
        dataClearPassword: hashedDataClearPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, session.userId));

    return NextResponse.json({
      message: "数据清空密码设置成功",
    });
  } catch (error) {
    console.error("设置数据清空密码错误:", error);
    return NextResponse.json(
      { error: "设置失败" },
      { status: 500 }
    );
  }
}
