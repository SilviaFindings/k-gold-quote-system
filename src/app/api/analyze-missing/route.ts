import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';

/**
 * POST /api/analyze-missing - 分析未同步的记录
 * Body:
 * - localProductIds: 本地产品ID列表
 * - localHistoryIds: 本地历史记录ID列表
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { localProductIds = [], localHistoryIds = [] } = body;

    console.log('🔍 分析未同步记录:', {
      userId: user.id,
      localProductCount: localProductIds.length,
      localHistoryCount: localHistoryIds.length,
    });

    // 1. 查询数据库中的所有产品ID
    const dbProducts = await productManager.getProducts(user.id, { limit: 10000 });
    const dbProductIds = dbProducts.map(p => p.id);
    console.log(`📦 数据库产品数量: ${dbProductIds.length}`);

    // 2. 查询数据库中的所有历史记录ID
    const dbHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });
    const dbHistoryIds = dbHistory.map(h => h.id);
    console.log(`📈 数据库历史记录数量: ${dbHistoryIds.length}`);

    // 3. 找出缺失的产品ID
    const missingProductIds = localProductIds.filter((id: string) => !dbProductIds.includes(id));
    console.log(`📦 缺失的产品数量: ${missingProductIds.length}`);

    // 4. 找出缺失的历史记录ID
    const missingHistoryIds = localHistoryIds.filter((id: string) => !dbHistoryIds.includes(id));
    console.log(`📈 缺失的历史记录数量: ${missingHistoryIds.length}`);

    // 5. 分析缺失记录的详细信息
    const missingHistoryDetails = [];
    for (const missingId of missingHistoryIds) {
      // 尝试用前缀匹配查找（检查是否是截断的问题）
      const truncatedId = missingId.substring(0, 36);
      const hasTruncated = dbHistoryIds.some(dbId => dbId === truncatedId);

      missingHistoryDetails.push({
        id: missingId,
        length: missingId.length,
        truncatedId: truncatedId,
        hasTruncated: hasTruncated,
        reason: hasTruncated
          ? `可能存在截断版本（${truncatedId}）`
          : '不存在于数据库',
      });
    }

    // 6. 统计ID长度分布
    const lengthStats: Record<number, number> = {};
    for (const id of missingHistoryIds) {
      const len = id.length;
      lengthStats[len] = (lengthStats[len] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      analysis: {
        products: {
          localCount: localProductIds.length,
          dbCount: dbProductIds.length,
          missingCount: missingProductIds.length,
          missingIds: missingProductIds.slice(0, 20), // 只返回前20个
        },
        history: {
          localCount: localHistoryIds.length,
          dbCount: dbHistoryIds.length,
          missingCount: missingHistoryIds.length,
          missingIds: missingHistoryIds,
          details: missingHistoryDetails,
          lengthStats: lengthStats,
          sampleTruncated: missingHistoryDetails.filter(d => d.hasTruncated).slice(0, 10),
        },
      },
    });
  } catch (error: any) {
    console.error('❌ 分析失败:', error);
    return NextResponse.json(
      { error: error.message || '分析失败', details: error.toString() },
      { status: 500 }
    );
  }
}
