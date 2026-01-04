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
 * - configs: 配置对象 { goldPrice, priceCoefficients, goldPriceTimestamp, dataVersion }
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
      hasDataVersion: !!configs?.dataVersion,
    });

    // 1. 同步产品数据
    if (Array.isArray(products) && products.length > 0) {
      console.log('📦 开始同步产品数据...');
      for (const product of products) {
        try {
          // 数据预处理：确保符合数据库 schema 要求
          const normalizedProduct = {
            ...product,
            // 确保 category 不为空
            category: product.category || '配件',
            // 确保必填字段有值
            subCategory: product.subCategory || '',
            specification: product.specification || '',
            supplierCode: product.supplierCode || '',
            // 确保数值字段有默认值
            weight: product.weight ?? 0,
            laborCost: product.laborCost ?? 0,
            goldPrice: product.goldPrice ?? 0,
            wholesalePrice: product.wholesalePrice ?? 0,
            retailPrice: product.retailPrice ?? 0,
            accessoryCost: product.accessoryCost ?? 0,
            stoneCost: product.stoneCost ?? 0,
            platingCost: product.platingCost ?? 0,
            moldCost: product.moldCost ?? 0,
            commission: product.commission ?? 0,
            // 确保可选字段有默认值
            orderChannel: product.orderChannel || null,
            shape: product.shape || null,
            // 处理特殊系数
            specialMaterialLoss: product.specialMaterialLoss ?? null,
            specialMaterialCost: product.specialMaterialCost ?? null,
            specialProfitMargin: product.specialProfitMargin ?? null,
            specialLaborFactorRetail: product.specialLaborFactorRetail ?? null,
            specialLaborFactorWholesale: product.specialLaborFactorWholesale ?? null,
            // 确保时间戳格式正确
            laborCostDate: product.laborCostDate ? new Date(product.laborCostDate) : new Date(),
            accessoryCostDate: product.accessoryCostDate ? new Date(product.accessoryCostDate) : new Date(),
            stoneCostDate: product.stoneCostDate ? new Date(product.stoneCostDate) : new Date(),
            platingCostDate: product.platingCostDate ? new Date(product.platingCostDate) : new Date(),
            moldCostDate: product.moldCostDate ? new Date(product.moldCostDate) : new Date(),
            commissionDate: product.commissionDate ? new Date(product.commissionDate) : new Date(),
            timestamp: product.timestamp ? new Date(product.timestamp) : new Date(),
          };

          // 数据完整性检查
          if (!normalizedProduct.id) {
            console.error('  ✗ 产品缺少 id:', normalizedProduct.productCode);
            continue;
          }

          if (!normalizedProduct.productCode) {
            console.error('  ✗ 产品缺少 productCode:', normalizedProduct.id);
            continue;
          }

          // 检查是否已存在（通过 id 和 userId）
          const existing = await productManager.getProductById(product.id, user.id);
          if (existing) {
            // 已存在，更新
            await productManager.updateProduct(product.id, user.id, normalizedProduct);
            updatedProducts++;
            console.log(`  ✓ 更新产品: ${normalizedProduct.productCode}`);
          } else {
            // 不存在，创建
            await productManager.createProduct(user.id, normalizedProduct);
            newProducts++;
            console.log(`  + 新建产品: ${normalizedProduct.productCode}`);
          }
          syncedProducts++;
        } catch (e) {
          console.error('  ✗ 同步产品失败:', product.productCode || product.id, e);
          // 继续处理其他产品，不中断整个同步过程
        }
      }
      console.log(`✅ 产品同步完成: 新建 ${newProducts} 个，更新 ${updatedProducts} 个`);
    } else {
      console.log('⚠️ 没有产品数据需要同步');
    }

    // 2. 同步价格历史
    if (Array.isArray(priceHistory) && priceHistory.length > 0) {
      console.log('📈 开始同步价格历史...');
      for (const history of priceHistory) {
        try {
          // 数据预处理：确保符合数据库 schema 要求
          const normalizedHistory = {
            ...history,
            // 确保 category 不为空
            category: history.category || '配件',
            // 确保必填字段有值
            subCategory: history.subCategory || '',
            specification: history.specification || '',
            supplierCode: history.supplierCode || '',
            // 确保数值字段有默认值
            weight: history.weight ?? 0,
            laborCost: history.laborCost ?? 0,
            goldPrice: history.goldPrice ?? 0,
            wholesalePrice: history.wholesalePrice ?? 0,
            retailPrice: history.retailPrice ?? 0,
            accessoryCost: history.accessoryCost ?? 0,
            stoneCost: history.stoneCost ?? 0,
            platingCost: history.platingCost ?? 0,
            moldCost: history.moldCost ?? 0,
            commission: history.commission ?? 0,
            // 确保可选字段有默认值
            orderChannel: history.orderChannel || null,
            shape: history.shape || null,
            // 处理特殊系数
            specialMaterialLoss: history.specialMaterialLoss || null,
            specialMaterialCost: history.specialMaterialCost || null,
            specialProfitMargin: history.specialProfitMargin || null,
            specialLaborFactorRetail: history.specialLaborFactorRetail || null,
            specialLaborFactorWholesale: history.specialLaborFactorWholesale || null,
            // 确保时间戳格式正确
            laborCostDate: history.laborCostDate ? new Date(history.laborCostDate) : new Date(),
            accessoryCostDate: history.accessoryCostDate ? new Date(history.accessoryCostDate) : new Date(),
            stoneCostDate: history.stoneCostDate ? new Date(history.stoneCostDate) : new Date(),
            platingCostDate: history.platingCostDate ? new Date(history.platingCostDate) : new Date(),
            moldCostDate: history.moldCostDate ? new Date(history.moldCostDate) : new Date(),
            commissionDate: history.commissionDate ? new Date(history.commissionDate) : new Date(),
            timestamp: history.timestamp ? new Date(history.timestamp) : new Date(),
          };

          // 数据完整性检查
          if (!normalizedHistory.id) {
            console.error('  ✗ 历史记录缺少 id:', normalizedHistory.productCode);
            continue;
          }

          if (!normalizedHistory.productId) {
            console.error('  ✗ 历史记录缺少 productId:', normalizedHistory.productCode);
            continue;
          }

          if (!normalizedHistory.productCode) {
            console.error('  ✗ 历史记录缺少 productCode:', normalizedHistory.id);
            continue;
          }

          // 检查是否已存在
          const existingHistory = await priceHistoryManager.getHistoryById(history.id, user.id);
          if (!existingHistory) {
            // 只同步不存在的历史记录
            await priceHistoryManager.createPriceHistory(user.id, normalizedHistory);
            syncedHistory++;
            console.log(`  + 新建历史记录: ${normalizedHistory.productCode}`);
          } else {
            skippedHistory++;
            console.log(`  - 跳过已存在的历史记录: ${normalizedHistory.productCode}`);
          }
        } catch (e) {
          console.error('  ✗ 同步历史记录失败:', history.productCode || history.id, e);
          // 继续处理其他历史记录，不中断整个同步过程
        }
      }
      console.log(`✅ 历史记录同步完成: 新建 ${syncedHistory} 条，跳过 ${skippedHistory} 条`);
    } else {
      console.log('⚠️ 没有价格历史需要同步');
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

        // 数据版本号
        if (configs.dataVersion !== undefined) {
          await appConfigManager.setConfig(user.id, 'dataVersion', {
            value: parseInt(configs.dataVersion),
            updatedAt: new Date().toISOString()
          });
          syncedConfigs++;
          console.log('  ✓ 同步数据版本号:', configs.dataVersion);
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

    // 获取同步后的数据版本号
    const dataVersionConfig = await appConfigManager.getConfig(user.id, 'dataVersion');

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
        dataVersion: dataVersionConfig?.configValue as number || null,
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
