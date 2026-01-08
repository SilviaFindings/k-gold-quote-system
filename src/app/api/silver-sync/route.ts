import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ProductManager } from '@/storage/database/productManager';
import { PriceHistoryManager } from '@/storage/database/priceHistoryManager';
import { appConfigManager } from '@/storage/database/appConfigManager';

// 创建管理器实例
const productManager = new ProductManager();
const priceHistoryManager = new PriceHistoryManager();

/**
 * GET /api/silver-sync - 获取银制品数据
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      console.log('❌ 未授权访问');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📥 获取银制品数据请求，用户ID:', user.id);

    // 获取银制品分类列表
    const silverCategories = ["配件", "宝石托", "链条", "其它"];

    // 获取所有产品
    const allProducts = await productManager.getProducts(user.id, { limit: 10000 });
    console.log(`📦 总产品数: ${allProducts.length}`);

    // 筛选银制品
    const silverProducts = allProducts
      .filter((p: any) => p.category && silverCategories.includes(p.category))
      .map((p: any) => ({
        ...p,
        // 映射到银制品字段
        silverColor: p.goldColor || '银色',
        silverPrice: p.goldPrice || 20,
      }));

    console.log(`✅ 筛选后银制品数: ${silverProducts.length}`);

    // 获取银制品价格历史
    const allHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });
    console.log(`📈 总历史记录数: ${allHistory.length}`);

    const silverHistory = allHistory
      .filter((h: any) => h.category && silverCategories.includes(h.category))
      .map((h: any) => ({
        ...h,
        // 映射到银制品字段
        silverColor: h.goldColor || '银色',
        silverPrice: h.goldPrice || 20,
      }));

    console.log(`✅ 筛选后历史记录数: ${silverHistory.length}`);

    // 获取银制品配置
    const silverPriceConfig = await appConfigManager.getConfig(user.id, 'silver_price_config');
    const silverPriceCoefficients = await appConfigManager.getConfig(user.id, 'silver_price_coefficients');

    return NextResponse.json({
      products: silverProducts,
      history: silverHistory,
      silverPrice: silverPriceConfig?.configValue || 20,
      coefficients: silverPriceCoefficients?.configValue || {},
    });
  } catch (error) {
    console.error('❌ 获取银制品数据失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/silver-sync - 同步银制品数据到数据库
 * Body:
 * - products: 产品数组
 * - priceHistory: 价格历史数组
 * - configs: 配置对象 { silverPrice, coefficients, dataVersion }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      console.error('❌ 同步失败: 未授权');
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

    console.log('='.repeat(60));
    console.log('📥 收到银制品同步请求:', {
      userId: user.id,
      userEmail: user.email,
      productsCount: Array.isArray(products) ? products.length : 0,
      historyCount: Array.isArray(priceHistory) ? priceHistory.length : 0,
      hasConfigs: !!configs,
      hasDataVersion: !!configs?.dataVersion,
    });
    console.log('='.repeat(60));

    // 1. 同步产品数据
    if (Array.isArray(products) && products.length > 0) {
      console.log('📦 开始同步银制品产品数据...');
      for (const product of products) {
        try {
          // 数据预处理：将银制品字段映射到金制品表结构
          const normalizedProduct = {
            ...product,
            // 银制品设置为925银
            karat: '925',
            // 银制品的字段映射到金制品字段
            goldColor: product.silverColor || '银色',
            goldPrice: product.silverPrice || 20,
            // 确保 category 不为空
            category: product.category || '配件',
            // 确保必填字段有值
            subCategory: product.subCategory || '',
            specification: product.specification || '',
            supplierCode: product.supplierCode || '',
            // 确保数值字段有默认值
            weight: product.weight ?? 0,
            laborCost: product.laborCost ?? 0,
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
            // 银制品没有特殊系数，设置为null
            specialMaterialLoss: null,
            specialMaterialCost: null,
            specialProfitMargin: null,
            specialLaborFactorRetail: null,
            specialLaborFactorWholesale: null,
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
            const { userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...productToInsert } = normalizedProduct as any;
            const dataToInsert = { ...productToInsert, id: product.id };
            await productManager.createProductWithId(user.id, dataToInsert);
            newProducts++;
            console.log(`  + 新建产品: ${normalizedProduct.productCode} (id: ${product.id})`);
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
      console.log('📈 开始同步银制品价格历史...');
      for (const history of priceHistory) {
        try {
          // 数据预处理：将银制品字段映射到金制品表结构
          const normalizedHistory = {
            ...history,
            // 银制品设置为925银
            karat: '925',
            // 银制品的字段映射到金制品字段
            goldColor: history.silverColor || '银色',
            goldPrice: history.silverPrice || 20,
            // 确保 category 不为空
            category: history.category || '配件',
            // 确保必填字段有值
            subCategory: history.subCategory || '',
            specification: history.specification || '',
            supplierCode: history.supplierCode || '',
            // 确保数值字段有默认值
            weight: history.weight ?? 0,
            laborCost: history.laborCost ?? 0,
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
            // 银制品没有特殊系数，设置为null
            specialMaterialLoss: null,
            specialMaterialCost: null,
            specialProfitMargin: null,
            specialLaborFactorRetail: null,
            specialLaborFactorWholesale: null,
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
            const { userId: _userId, createdAt: _createdAt, ...historyToInsert } = normalizedHistory as any;
            const dataToInsert = { ...historyToInsert, id: history.id };

            try {
              await priceHistoryManager.createPriceHistoryWithId(user.id, dataToInsert);
              syncedHistory++;
              console.log(`  + 新建历史记录: ${normalizedHistory.productCode} (id: ${history.id})`);
            } catch (insertError: any) {
              console.error(`  ✗ 插入历史记录失败: ${normalizedHistory.productCode}`);
              console.error(`     错误信息: ${insertError.message}`);
              // 继续处理其他历史记录
            }
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
        // 银价配置
        if (configs.silverPrice) {
          await appConfigManager.setConfig(user.id, 'silver_price_config', {
            value: parseFloat(configs.silverPrice),
            updatedAt: new Date().toISOString()
          });
          syncedConfigs++;
          console.log('  ✓ 同步银价配置');
        }

        // 价格系数
        if (configs.coefficients) {
          await appConfigManager.setConfig(user.id, 'silver_price_coefficients', {
            value: configs.coefficients,
            updatedAt: new Date().toISOString()
          });
          syncedConfigs++;
          console.log('  ✓ 同步银制品价格系数配置');
        }

        // 数据版本号
        if (configs.dataVersion !== undefined) {
          await appConfigManager.setConfig(user.id, 'silver_data_version', {
            value: parseInt(configs.dataVersion),
            updatedAt: new Date().toISOString()
          });
          syncedConfigs++;
          console.log('  ✓ 同步银制品数据版本号:', configs.dataVersion);
        }
      } catch (e) {
        console.error('  ✗ 同步配置失败:', e);
      }
      console.log('✅ 配置同步完成');
    }

    console.log('🎉 银制品同步全部完成:', {
      products: { total: syncedProducts, new: newProducts, updated: updatedProducts },
      history: { total: syncedHistory, skipped: skippedHistory },
      configs: syncedConfigs,
    });

    const result = {
      success: true,
      message: '银制品数据同步成功',
      stats: {
        syncedProducts,
        newProducts,
        updatedProducts,
        syncedHistory,
        skippedHistory,
        syncedConfigs,
      }
    };

    console.log('✅ 返回同步结果:', result);
    console.log('='.repeat(60));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ 银制品同步失败:', error);
    console.error('错误堆栈:', error.stack);
    return NextResponse.json(
      { error: error.message || '银制品数据同步失败', details: error.toString() },
      { status: 500 }
    );
  }
}
