import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';
import { appConfigManager } from '@/storage/database/appConfigManager';

/**
 * GET /api/diagnostic - 诊断数据库状态
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 诊断数据库状态:', { userId: user.id, userEmail: user.email });

    // 1. 查询产品数据
    const dbProducts = await productManager.getProducts(user.id, { limit: 10000 });
    console.log(`📦 数据库中的产品数据: ${dbProducts.length} 条`);

    // 2. 查询价格历史
    const dbHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });
    console.log(`📈 数据库中的价格历史: ${dbHistory.length} 条`);

    // 3. 查询配置数据
    const dbConfigs = await appConfigManager.getAllConfigs(user.id);
    console.log(`⚙️  数据库中的配置数据: ${dbConfigs.length} 条`);

    // 4. 返回详细诊断信息
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      database: {
        products: {
          count: dbProducts.length,
          sampleIds: dbProducts.slice(0, 5).map(p => ({
            id: p.id,
            productCode: p.productCode,
            productName: p.productName,
          })),
        },
        priceHistory: {
          count: dbHistory.length,
          sampleIds: dbHistory.slice(0, 5).map(h => ({
            id: h.id,
            productCode: h.productCode,
            productId: h.productId,
          })),
        },
        configs: {
          count: dbConfigs.length,
          keys: dbConfigs.map(c => c.configKey),
        },
      },
    });
  } catch (error: any) {
    console.error('❌ 诊断失败:', error);
    return NextResponse.json(
      { error: error.message || '诊断失败', details: error.toString() },
      { status: 500 }
    );
  }
}
