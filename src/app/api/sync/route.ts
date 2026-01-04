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
    let updatedProducts = 0;
    let newProducts = 0;
    let syncedHistory = 0;
    let skippedHistory = 0;
    let syncedConfigs = 0;

    console.log('📥 收到同步请求:', {
      userId: user.id,
      productsCount: Array.isArray(products) ? products.length : 0,
      historyCount: Array.isArray(priceHistory) ? priceHistory.length : 0,
      hasConfigs: !!configs,
    });

    // 1. 同步产品数据
    if (Array.isArray(products) && products.length > 0) {
      console.log('📦 开始同步产品数据...');
      for (const product of products) {
        try {
          // 检查是否已存在（通过 id 和 userId）
          const existing = await productManager.getProductById(product.id, user.id);
          if (existing) {
            // 已存在，更新
            await productManager.updateProduct(product.id, user.id, product);
            updatedProducts++;
            console.log(`  ✓ 更新产品: ${product.productCode}`);
          } else {
            // 不存在，创建
            await productManager.createProduct(user.id, product);
            newProducts++;
            console.log(`  + 新建产品: ${product.productCode}`);
          }
          syncedProducts++;
        } catch (e) {
          console.error('  ✗ 同步产品失败:', product.productCode, e);
        }
      }
      console.log(`✅ 产品同步完成: 新建 ${newProducts} 个，更新 ${updatedProducts} 个`);
    }

    // 2. 同步价格历史
    if (Array.isArray(priceHistory) && priceHistory.length > 0) {
      console.log('📈 开始同步价格历史...');
      for (const history of priceHistory) {
        try {
          // 检查是否已存在
          const existingHistory = await priceHistoryManager.getHistoryById(history.id, user.id);
          if (!existingHistory) {
            // 只同步不存在的历史记录
            await priceHistoryManager.createPriceHistory(user.id, history);
            syncedHistory++;
            console.log(`  + 新建历史记录: ${history.productCode}`);
          } else {
            skippedHistory++;
            console.log(`  - 跳过已存在的历史记录: ${history.productCode}`);
          }
        } catch (e) {
          console.error('  ✗ 同步历史记录失败:', history.productCode, e);
        }
      }
      console.log(`✅ 历史记录同步完成: 新建 ${syncedHistory} 条，跳过 ${skippedHistory} 条`);
    }

    // 3. 同步配置
    if (configs) {
      console.log('⚙️  开始同步配置...');
      try {
        // 金价配置
        if (configs.goldPrice) {
          await appConfigManager.setConfig(user.id, 'goldPrice', {
            value: parseFloat(configs.goldPrice),
            updatedAt: configs.goldPriceTimestamp || new Date().toISOString()
          });
          syncedConfigs++;
          console.log('  ✓ 同步金价配置');
        }

        // 价格系数
        if (configs.priceCoefficients) {
          await appConfigManager.setConfig(user.id, 'priceCoefficients', {
            value: configs.priceCoefficients,
            updatedAt: new Date().toISOString()
          });
          syncedConfigs++;
          console.log('  ✓ 同步价格系数配置');
        }
      } catch (e) {
        console.error('  ✗ 同步配置失败:', e);
      }
      console.log('✅ 配置同步完成');
    }

    console.log('🎉 同步全部完成:', {
      products: { total: syncedProducts, new: newProducts, updated: updatedProducts },
      history: { total: syncedHistory, skipped: skippedHistory },
      configs: syncedConfigs,
    });

    return NextResponse.json({
      success: true,
      message: '数据同步成功',
      stats: {
        syncedProducts,
        newProducts,
        updatedProducts,
        syncedHistory,
        skippedHistory,
        syncedConfigs,
      }
    });
  } catch (error: any) {
    console.error('❌ 数据同步失败:', error);
    return NextResponse.json(
      { error: error.message || '数据同步失败' },
      { status: 500 }
    );
  }
}
