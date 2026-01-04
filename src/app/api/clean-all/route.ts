import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import { productManager } from '@/storage/database/productManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';
import { appConfigManager } from '@/storage/database/appConfigManager';

/**
 * POST /api/clean-all - 清空所有用户数据
 * 警告：此操作不可逆，会删除所有产品、价格历史和配置
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ 收到清空请求');

    const user = await isAuthenticated(request);
    if (!user) {
      console.error('❌ 未授权访问');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ 用户认证成功:', user.email, 'ID:', user.id);

    const results = {
      productsDeleted: 0,
      historyDeleted: 0,
      configDeleted: false,
      errors: [] as string[],
    };

    // 1. 删除所有价格历史
    console.log('📝 步骤1: 开始删除价格历史...');
    try {
      const deletedHistory = await priceHistoryManager.deleteAllHistory(user.id);
      results.historyDeleted = deletedHistory;
      console.log(`✅ 删除价格历史: ${deletedHistory} 条`);
    } catch (e: any) {
      const error = `删除价格历史失败: ${e.message}`;
      results.errors.push(error);
      console.error('❌', error, e);
    }

    // 2. 删除所有产品
    console.log('📝 步骤2: 开始删除产品...');
    try {
      const db = await getDb();
      const deleteResult = await db.execute(sql`
        DELETE FROM products
        WHERE user_id = ${user.id}
      `);
      results.productsDeleted = deleteResult.rowCount ?? 0;
      console.log(`✅ 删除产品: ${results.productsDeleted} 条`);
    } catch (e: any) {
      const error = `删除产品失败: ${e.message}`;
      results.errors.push(error);
      console.error('❌', error, e);
    }

    // 3. 删除所有配置
    console.log('📝 步骤3: 开始删除配置...');
    try {
      const db = await getDb();
      const deleteResult = await db.execute(sql`
        DELETE FROM app_config
        WHERE user_id = ${user.id}
      `);
      results.configDeleted = true;
      console.log('✅ 删除配置');
    } catch (e: any) {
      const error = `删除配置失败: ${e.message}`;
      results.errors.push(error);
      console.error('❌', error, e);
    }

    console.log('🗑️ 数据清理完成');
    console.log('最终结果:', JSON.stringify(results, null, 2));

    const response = {
      success: results.errors.length === 0,
      message: '数据清理完成',
      results,
    };
    console.log('响应数据:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ 清理失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '清理失败', details: error.toString() },
      { status: 500 }
    );
  }
}
