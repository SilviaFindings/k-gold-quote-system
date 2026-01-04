import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';

/**
 * POST /api/diagnose-failed - 诊断失败的记录
 * Body:
 * - missingIds: 未同步的ID列表
 * - localHistory: 本地历史记录数组
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { missingIds = [], localHistory = [] } = body;

    console.log('🔍 诊断失败的记录:', {
      userId: user.id,
      missingCount: missingIds.length,
    });

    // 查询数据库中的所有产品
    const dbProducts = await productManager.getProducts(user.id, { limit: 10000 });
    const dbProductIds = new Set(dbProducts.map(p => p.id));

    // 查询数据库中的所有历史记录
    const dbHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });
    const dbHistoryIds = new Set(dbHistory.map(h => h.id));

    const results = [];
    const issues: any = {
      missingProduct: [],
      duplicateId: [],
      shortIdExists: [],
      other: [],
    };

    for (const missingId of missingIds) {
      // 查找本地记录
      const localRecord = localHistory.find((h: any) => h.id === missingId);

      if (!localRecord) {
        issues.other.push({
          id: missingId,
          reason: '本地找不到对应记录',
        });
        continue;
      }

      const diagnosis: any = {
        id: missingId,
        productId: localRecord.productId,
        productCode: localRecord.productCode,
        length: missingId.length,
      };

      // 检查1: productId是否存在
      if (!dbProductIds.has(localRecord.productId)) {
        diagnosis.reason = 'productId不存在于数据库';
        diagnosis.productIdExists = false;
        issues.missingProduct.push(diagnosis);
      } else {
        diagnosis.productIdExists = true;
      }

      // 检查2: ID是否被截断（检查是否存在前36个字符相同的记录）
      const truncatedId = missingId.substring(0, 36);
      if (dbHistoryIds.has(truncatedId) && !dbHistoryIds.has(missingId)) {
        diagnosis.reason = '存在截断版本的ID';
        diagnosis.truncatedId = truncatedId;
        issues.shortIdExists.push(diagnosis);
      }

      // 检查3: 是否是重复ID
      const duplicateInLocal = localHistory.filter((h: any) => h.id === missingId).length;
      if (duplicateInLocal > 1) {
        diagnosis.reason = '本地存在重复ID';
        diagnosis.duplicateCount = duplicateInLocal;
        issues.duplicateId.push(diagnosis);
      }

      results.push(diagnosis);
    }

    console.log('诊断结果:', {
      missingProduct: issues.missingProduct.length,
      shortIdExists: issues.shortIdExists.length,
      duplicateId: issues.duplicateId.length,
      other: issues.other.length,
    });

    return NextResponse.json({
      success: true,
      results,
      issues,
      summary: {
        missingProduct: issues.missingProduct.length,
        shortIdExists: issues.shortIdExists.length,
        duplicateId: issues.duplicateId.length,
        other: issues.other.length,
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
