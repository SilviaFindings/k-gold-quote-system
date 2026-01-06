import { NextRequest, NextResponse } from "next/server";
import { getDb } from "coze-coding-dev-sdk";
import { products, priceHistory, appConfig, passwordResetTokens } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
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

    const { confirmed } = await req.json();

    if (!confirmed) {
      return NextResponse.json(
        { error: "请确认清空数据操作" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = session.userId;

    // 开始事务，确保数据删除的一致性
    await db.transaction(async (tx) => {
      // 删除密码重置 token
      await tx
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, userId));

      // 删除价格历史记录
      await tx
        .delete(priceHistory)
        .where(eq(priceHistory.userId, userId));

      // 删除应用配置
      await tx
        .delete(appConfig)
        .where(eq(appConfig.userId, userId));

      // 删除产品数据
      await tx
        .delete(products)
        .where(eq(products.userId, userId));
    });

    return NextResponse.json({
      message: "数据清空成功",
    });
  } catch (error) {
    console.error("清空数据错误:", error);
    return NextResponse.json(
      { error: "清空失败" },
      { status: 500 }
    );
  }
}
