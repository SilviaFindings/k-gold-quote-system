import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getDb } from 'coze-coding-dev-sdk';
import { products, priceHistory, appConfig } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * DELETE /api/clear-all-data - 彻底清除用户的所有数据（数据库）
 * 注意：此操作不可撤销，请谨慎使用
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ 开始清除用户数据:', { userId: user.id });

    const db = await getDb();

    // 1. 删除所有价格历史
    const deletedHistory = await db
      .delete(priceHistory)
      .where(eq(priceHistory.userId, user.id))
      .returning();
    console.log(`  - 删除价格历史: ${deletedHistory.length} 条`);

    // 2. 删除所有产品
    const deletedProducts = await db
      .delete(products)
      .where(eq(products.userId, user.id))
      .returning();
    console.log(`  - 删除产品: ${deletedProducts.length} 个`);

    // 3. 删除所有配置
    const deletedConfigs = await db
      .delete(appConfig)
      .where(eq(appConfig.userId, user.id))
      .returning();
    console.log(`  - 删除配置: ${deletedConfigs.length} 条`);

    console.log('✅ 数据清除完成');

    return NextResponse.json({
      success: true,
      deletedCounts: {
        products: deletedProducts.length,
        history: deletedHistory.length,
        configs: deletedConfigs.length,
      },
    });
  } catch (error) {
    console.error('❌ 清除数据失败:', error);
    return NextResponse.json(
      { error: '清除数据失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
