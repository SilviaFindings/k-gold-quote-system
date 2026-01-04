import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { appConfigManager } from '@/storage/database/appConfigManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';
import * as XLSX from 'xlsx';
import type { Product, PriceHistory, AppConfig } from '@/storage/database/shared/schema';

/**
 * 辅助函数：将数据库中的字符串数值转换为数字
 */
function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * 辅助函数：将字符串日期格式化为易读格式
 */
function formatDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * 辅助函数：规范化产品数据（确保数值类型正确）
 */
function normalizeProduct(product: Product): any {
  return {
    ...product,
    // 转换数值字段
    weight: safeNumber(product.weight),
    laborCost: safeNumber(product.laborCost),
    goldPrice: safeNumber(product.goldPrice),
    wholesalePrice: safeNumber(product.wholesalePrice),
    retailPrice: safeNumber(product.retailPrice),
    accessoryCost: safeNumber(product.accessoryCost),
    stoneCost: safeNumber(product.stoneCost),
    platingCost: safeNumber(product.platingCost),
    moldCost: safeNumber(product.moldCost),
    commission: safeNumber(product.commission),
    // 特殊系数
    specialMaterialLoss: safeNumber(product.specialMaterialLoss),
    specialMaterialCost: safeNumber(product.specialMaterialCost),
    specialProfitMargin: safeNumber(product.specialProfitMargin),
    specialLaborFactorRetail: safeNumber(product.specialLaborFactorRetail),
    specialLaborFactorWholesale: safeNumber(product.specialLaborFactorWholesale),
    // 格式化日期
    laborCostDate: formatDate(product.laborCostDate),
    accessoryCostDate: formatDate(product.accessoryCostDate),
    stoneCostDate: formatDate(product.stoneCostDate),
    platingCostDate: formatDate(product.platingCostDate),
    moldCostDate: formatDate(product.moldCostDate),
    commissionDate: formatDate(product.commissionDate),
    timestamp: formatDate(product.timestamp),
    createdAt: formatDate(product.createdAt),
    updatedAt: formatDate(product.updatedAt),
  };
}

/**
 * 辅助函数：规范化价格历史数据
 */
function normalizeHistory(history: PriceHistory): any {
  return {
    ...history,
    // 转换数值字段
    weight: safeNumber(history.weight),
    laborCost: safeNumber(history.laborCost),
    goldPrice: safeNumber(history.goldPrice),
    wholesalePrice: safeNumber(history.wholesalePrice),
    retailPrice: safeNumber(history.retailPrice),
    accessoryCost: safeNumber(history.accessoryCost),
    stoneCost: safeNumber(history.stoneCost),
    platingCost: safeNumber(history.platingCost),
    moldCost: safeNumber(history.moldCost),
    commission: safeNumber(history.commission),
    // 特殊系数
    specialMaterialLoss: safeNumber(history.specialMaterialLoss),
    specialMaterialCost: safeNumber(history.specialMaterialCost),
    specialProfitMargin: safeNumber(history.specialProfitMargin),
    specialLaborFactorRetail: safeNumber(history.specialLaborFactorRetail),
    specialLaborFactorWholesale: safeNumber(history.specialLaborFactorWholesale),
    // 格式化日期
    laborCostDate: formatDate(history.laborCostDate),
    accessoryCostDate: formatDate(history.accessoryCostDate),
    stoneCostDate: formatDate(history.stoneCostDate),
    platingCostDate: formatDate(history.platingCostDate),
    moldCostDate: formatDate(history.moldCostDate),
    commissionDate: formatDate(history.commissionDate),
    timestamp: formatDate(history.timestamp),
    createdAt: formatDate(history.createdAt),
  };
}

/**
 * 辅助函数：规范化配置数据
 */
function normalizeConfig(config: AppConfig): any {
  return {
    ...config,
    configValue: config.configValue, // JSONB 对象，保持原样
    createdAt: formatDate(config.createdAt),
    updatedAt: formatDate(config.updatedAt || null),
  };
}

/**
 * GET /api/export - 导出数据
 * Query参数:
 * - format: 'json' 或 'excel'
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    console.log('📤 开始导出数据:', {
      userId: user.id,
      format: format,
    });

    // 获取所有数据
    const products = await productManager.getProducts(user.id, { limit: 10000 });
    const configs = await appConfigManager.getAllConfigs(user.id);
    const priceHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });

    console.log('📊 数据统计:', {
      productsCount: products.length,
      configsCount: configs.length,
      historyCount: priceHistory.length,
    });

    // 规范化数据（确保数值类型正确）
    const normalizedProducts = products.map(normalizeProduct);
    const normalizedConfigs = configs.map(normalizeConfig);
    const normalizedHistory = priceHistory.map(normalizeHistory);

    // 构建导出数据
    const exportData = {
      exportTime: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      products: normalizedProducts,
      configs: normalizedConfigs,
      priceHistory: normalizedHistory,
      dataSummary: {
        totalProducts: products.length,
        totalConfigs: configs.length,
        totalHistory: priceHistory.length,
      },
    };

    // 根据格式返回
    if (format === 'excel') {
      console.log('📄 生成 Excel 文件...');

      // 导出Excel
      const workbook = XLSX.utils.book_new();

      // 产品数据Sheet
      const productSheetData = normalizedProducts.map(p => ({
        '货号': p.productCode,
        '类别': p.category,
        '子类别': p.subCategory,
        '名称': p.productName,
        '规格': p.specification,
        '重量': p.weight,
        'K数': p.karat,
        '颜色': p.goldColor,
        '工费': p.laborCost,
        '金价': p.goldPrice,
        '零售价': p.retailPrice,
        '批发价': p.wholesalePrice,
        '配件成本': p.accessoryCost,
        '石头成本': p.stoneCost,
        '电镀成本': p.platingCost,
        '模具成本': p.moldCost,
        '佣金(%)': p.commission,
        '供应商代码': p.supplierCode,
        '下单口': p.orderChannel,
        '形状': p.shape,
        // 特殊系数
        '特殊材料损耗': p.specialMaterialLoss,
        '特殊材料浮动': p.specialMaterialCost,
        '特殊关税系数': p.specialProfitMargin,
        '特殊零售工费系数': p.specialLaborFactorRetail,
        '特殊批发工费系数': p.specialLaborFactorWholesale,
        // 成本时间戳
        '工费更新时间': p.laborCostDate,
        '配件更新时间': p.accessoryCostDate,
        '石头更新时间': p.stoneCostDate,
        '电镀更新时间': p.platingCostDate,
        '模具更新时间': p.moldCostDate,
        '佣金更新时间': p.commissionDate,
        '记录时间': p.timestamp,
        '创建时间': p.createdAt,
        '更新时间': p.updatedAt,
      }));
      const productSheet = XLSX.utils.json_to_sheet(productSheetData);
      XLSX.utils.book_append_sheet(workbook, productSheet, '产品数据');

      // 价格历史Sheet
      const historySheetData = normalizedHistory.map(h => ({
        '货号': h.productCode,
        '名称': h.productName,
        '重量': h.weight,
        'K数': h.karat,
        '颜色': h.goldColor,
        '工费': h.laborCost,
        '金价': h.goldPrice,
        '零售价': h.retailPrice,
        '批发价': h.wholesalePrice,
        '配件成本': h.accessoryCost,
        '石头成本': h.stoneCost,
        '电镀成本': h.platingCost,
        '模具成本': h.moldCost,
        '佣金(%)': h.commission,
        '供应商代码': h.supplierCode,
        '下单口': h.orderChannel,
        '形状': h.shape,
        // 特殊系数
        '特殊材料损耗': h.specialMaterialLoss,
        '特殊材料浮动': h.specialMaterialCost,
        '特殊关税系数': h.specialProfitMargin,
        '特殊零售工费系数': h.specialLaborFactorRetail,
        '特殊批发工费系数': h.specialLaborFactorWholesale,
        // 成本时间戳
        '工费更新时间': h.laborCostDate,
        '配件更新时间': h.accessoryCostDate,
        '石头更新时间': h.stoneCostDate,
        '电镀更新时间': h.platingCostDate,
        '模具更新时间': h.moldCostDate,
        '佣金更新时间': h.commissionDate,
        '记录时间': h.timestamp,
        '创建时间': h.createdAt,
        '更新时间': h.updatedAt,
      }));
      const historySheet = XLSX.utils.json_to_sheet(historySheetData);
      XLSX.utils.book_append_sheet(workbook, historySheet, '价格历史');

      // 配置数据Sheet
      const configSheetData = normalizedConfigs.map(c => ({
        '配置项': c.configKey,
        '配置值': JSON.stringify(c.configValue, null, 2),
        '更新时间': c.updatedAt,
        '创建时间': c.createdAt,
      }));
      const configSheet = XLSX.utils.json_to_sheet(configSheetData);
      XLSX.utils.book_append_sheet(workbook, configSheet, '系统配置');

      // 生成Excel文件
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      console.log('✅ Excel 文件生成成功');

      // 返回文件
      const fileName = `珠宝报价单备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      });
    } else {
      console.log('📄 生成 JSON 文件...');

      // 导出JSON
      const jsonStr = JSON.stringify(exportData, null, 2);
      const fileName = `珠宝报价单备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;

      console.log('✅ JSON 文件生成成功');

      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      });
    }
  } catch (error) {
    console.error('❌ 导出数据失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
