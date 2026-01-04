import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { appConfigManager } from '@/storage/database/appConfigManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';
import type { Product, PriceHistory } from '@/storage/database/shared/schema';

/**
 * POST /api/sync - 同步本地数据到数据库
 * Body:
 * - products: 产品数组
 * - priceHistory: 价格历史数组
 * - configs: 配置对象 { goldPrice, priceCoefficients, goldPriceTimestamp }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { products, priceHistory, configs } = body;

    let syncedProducts = 0;
    let syncedHistory = 0;
    let syncedConfigs = 0;

    // 1. 同步产品数据
    if (Array.isArray(products) && products.length > 0) {
      for (const product of products) {
        try {
          // 检查是否已存在（通过 id 和 userId）
          const existing = await productManager.getProductById(product.id, user.id);
          if (existing) {
            // 已存在，更新
            await productManager.updateProduct(product.id, user.id, product);
          } else {
            // 不存在，创建
            await productManager.createProduct(user.id, product);
          }
          syncedProducts++;
        } catch (e) {
          console.error('同步产品失败:', product.id, e);
        }
      }
    }

    // 2. 同步价格历史
    if (Array.isArray(priceHistory) && priceHistory.length > 0) {
      for (const history of priceHistory) {
        try {
          // 检查是否已存在
          const existingHistory = await priceHistoryManager.getHistoryById(history.id, user.id);
          if (!existingHistory) {
            // 只同步不存在的历史记录
            await priceHistoryManager.createPriceHistory(user.id, history);
            syncedHistory++;
          }
        } catch (e) {
          console.error('同步历史记录失败:', history.id, e);
        }
      }
    }

    // 3. 同步配置
    if (configs) {
      try {
        // 金价配置
        if (configs.goldPrice) {
          await appConfigManager.setConfig(user.id, 'goldPrice', {
            value: parseFloat(configs.goldPrice),
            updatedAt: configs.goldPriceTimestamp || new Date().toISOString()
          });
          syncedConfigs++;
        }

        // 价格系数
        if (configs.priceCoefficients) {
          await appConfigManager.setConfig(user.id, 'priceCoefficients', {
            value: configs.priceCoefficients,
            updatedAt: new Date().toISOString()
          });
          syncedConfigs++;
        }
      } catch (e) {
        console.error('同步配置失败:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: '数据同步成功',
      stats: {
        syncedProducts,
        syncedHistory,
        syncedConfigs
      }
    });
  } catch (error: any) {
    console.error('数据同步失败:', error);
    return NextResponse.json(
      { error: error.message || '数据同步失败' },
      { status: 500 }
    );
  }
}
