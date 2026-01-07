import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ProductManager } from '@/storage/database/productManager';
import { PriceHistoryManager } from '@/storage/database/priceHistoryManager';
import { appConfigManager } from '@/storage/database/appConfigManager';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';

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
    console.log('🏷️ 银制品分类列表:', silverCategories);

    // 获取所有产品
    const allProducts = await productManager.getProducts(user.id, { limit: 10000 });
    console.log(`📦 总产品数: ${allProducts.length}`);

    // 筛选银制品并标准化字段
    const silverProducts = allProducts
      .filter((p: any) => {
        const isSilver = p.category && silverCategories.includes(p.category);
        if (!isSilver && p.category) {
          console.log(`  ⚠️ 排除产品: ${p.productCode}, 分类: ${p.category} (不在银制品分类中)`);
        }
        return isSilver;
      })
      .map((p: any) => ({
        ...p,
        // 确保数值字段有默认值
        weight: p.weight ?? 0,
        laborCost: p.laborCost ?? 0,
        silverPrice: p.silverPrice ?? 20,
        wholesalePrice: p.wholesalePrice ?? 0,
        retailPrice: p.retailPrice ?? 0,
        accessoryCost: p.accessoryCost ?? 0,
        stoneCost: p.stoneCost ?? 0,
        platingCost: p.platingCost ?? 0,
        moldCost: p.moldCost ?? 0,
        commission: p.commission ?? 0,
        batchQuantity: p.batchQuantity ?? 0,
        quantity: p.quantity ?? 0,
        // 确保字符串字段有默认值
        category: p.category || "",
        subCategory: p.subCategory || "",
        productCode: p.productCode || "",
        productName: p.productName || "",
        specification: p.specification || "",
        silverColor: p.silverColor || "银色",
        supplierCode: p.supplierCode || "E1",
        remarks: p.remarks || "",
        // 确保日期字段有默认值
        quantityDate: p.quantityDate || "",
        laborCostDate: p.laborCostDate || "",
        accessoryCostDate: p.accessoryCostDate || "",
        stoneCostDate: p.stoneCostDate || "",
        platingCostDate: p.platingCostDate || "",
        moldCostDate: p.moldCostDate || "",
        commissionDate: p.commissionDate || "",
      }));

    console.log(`✅ 筛选后银制品数: ${silverProducts.length}`);

    // 获取银制品价格历史
    const allHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });
    console.log(`📈 总历史记录数: ${allHistory.length}`);

    const silverHistory = allHistory
      .filter((h: any) => {
        const isSilver = h.category && silverCategories.includes(h.category);
        return isSilver;
      })
      .map((h: any) => ({
        ...h,
        // 确保数值字段有默认值
        weight: h.weight ?? 0,
        laborCost: h.laborCost ?? 0,
        silverPrice: h.silverPrice ?? 20,
        wholesalePrice: h.wholesalePrice ?? 0,
        retailPrice: h.retailPrice ?? 0,
        accessoryCost: h.accessoryCost ?? 0,
        stoneCost: h.stoneCost ?? 0,
        platingCost: h.platingCost ?? 0,
        moldCost: h.moldCost ?? 0,
        commission: h.commission ?? 0,
        batchQuantity: h.batchQuantity ?? 0,
        quantity: h.quantity ?? 0,
      }));

    console.log(`✅ 筛选后历史记录数: ${silverHistory.length}`);

    // 获取银制品配置
    const silverPriceConfig = await appConfigManager.getConfig(user.id, 'silver_price_config');
    const silverPriceCoefficients = await appConfigManager.getConfig(user.id, 'silver_price_coefficients');

    console.log('⚙️ 银价配置:', silverPriceConfig?.configValue);
    console.log('⚙️ 价格系数:', silverPriceCoefficients?.configValue);

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
 * - history: 价格历史数组
 * - silverPrice: 银价
 * - coefficients: 价格系数
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { products, history, silverPrice, coefficients } = body;

    let syncedProducts = 0;
    let updatedProducts = 0;
    let newProducts = 0;
    let syncedHistory = 0;

    console.log('📥 收到银制品同步请求:', {
      userId: user.id,
      productsCount: Array.isArray(products) ? products.length : 0,
      historyCount: Array.isArray(history) ? history.length : 0,
    });

    // 1. 同步产品数据
    if (Array.isArray(products) && products.length > 0) {
      console.log('📦 开始同步银制品产品数据...');
      for (const product of products) {
        try {
          // 数据预处理：将银制品字段映射到金制品表结构
          const normalizedProduct = {
            ...product,
            // 银制品不需要karat，设置为空字符串或默认值
            karat: '925', // 银制品默认925
            goldColor: product.silverColor || '银色', // 银制品的颜色映射到goldColor
            goldPrice: product.silverPrice || 20, // 银价映射到goldPrice
            // 确保必填字段有值
            category: product.category || '配件',
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
        }
      }
      console.log(`✅ 银制品产品同步完成: 新建 ${newProducts} 个，更新 ${updatedProducts} 个`);
    }

    // 2. 同步价格历史
    if (Array.isArray(history) && history.length > 0) {
      console.log('📈 开始同步银制品价格历史...');
      for (const hist of history) {
        try {
          const normalizedHistory = {
            ...hist,
            karat: '925',
            goldColor: hist.silverColor || '银色',
            goldPrice: hist.silverPrice || 20,
          };

          // 检查历史记录是否已存在
          const existing = await priceHistoryManager.getHistoryById(hist.id, user.id);
          if (existing) {
            // 已存在，跳过
            continue;
          }

          // 创建历史记录
          const { userId: _userId, createdAt: _createdAt, ...historyToInsert } = normalizedHistory as any;
          await priceHistoryManager.createPriceHistoryWithId(user.id, { ...historyToInsert, id: hist.id });
          syncedHistory++;
        } catch (e) {
          console.error('  ✗ 同步历史记录失败:', hist.productCode || hist.id, e);
        }
      }
      console.log(`✅ 银制品历史记录同步完成: ${syncedHistory} 条`);
    }

    // 3. 保存配置
    if (silverPrice !== undefined) {
      await appConfigManager.setConfig(user.id, 'silver_price_config', silverPrice);
      console.log('✅ 银价配置已保存');
    }

    if (coefficients) {
      await appConfigManager.setConfig(user.id, 'silver_price_coefficients', coefficients);
      console.log('✅ 银制品价格系数已保存');
    }

    return NextResponse.json({
      success: true,
      syncedProducts,
      updatedProducts,
      newProducts,
      syncedHistory,
    });
  } catch (error) {
    console.error('银制品同步失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
