import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager } from '@/storage/database/productManager';
import { appConfigManager } from '@/storage/database/appConfigManager';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';
import * as XLSX from 'xlsx';

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

    // 获取所有数据
    const products = await productManager.getProducts(user.id, { limit: 10000 });
    const configs = await appConfigManager.getAllConfigs(user.id);
    const priceHistory = await priceHistoryManager.getHistoryByUserId(user.id, { limit: 10000 });

    // 构建导出数据
    const exportData = {
      exportTime: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      products: products,
      configs: configs,
      priceHistory: priceHistory,
    };

    // 根据格式返回
    if (format === 'excel') {
      // 导出Excel
      const workbook = XLSX.utils.book_new();

      // 产品数据Sheet
      const productSheetData = products.map(p => ({
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
        '创建时间': p.createdAt,
        '更新时间': p.updatedAt,
      }));
      const productSheet = XLSX.utils.json_to_sheet(productSheetData);
      XLSX.utils.book_append_sheet(workbook, productSheet, '产品数据');

      // 价格历史Sheet
      const historySheetData = priceHistory.map(h => ({
        '货号': h.productCode,
        '金价': h.goldPrice,
        '零售价': h.retailPrice,
        '批发价': h.wholesalePrice,
        '记录时间': h.createdAt,
      }));
      const historySheet = XLSX.utils.json_to_sheet(historySheetData);
      XLSX.utils.book_append_sheet(workbook, historySheet, '价格历史');

      // 配置数据Sheet
      const configSheetData = configs.map(c => ({
        '配置项': c.configKey,
        '配置值': JSON.stringify(c.configValue),
        '更新时间': c.updatedAt,
      }));
      const configSheet = XLSX.utils.json_to_sheet(configSheetData);
      XLSX.utils.book_append_sheet(workbook, configSheet, '系统配置');

      // 生成Excel文件
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

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
      // 导出JSON
      const jsonStr = JSON.stringify(exportData, null, 2);
      const fileName = `珠宝报价单备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;

      return new NextResponse(jsonStr, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      });
    }
  } catch (error) {
    console.error('Export data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
