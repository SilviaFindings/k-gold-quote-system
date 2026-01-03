import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { appConfigManager } from '@/storage/database';

/**
 * POST /api/init - 初始化默认配置
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 默认价格系数
    const defaultCoefficients = {
      laborFactorMode: "fixed",
      fixedLaborFactorRetail: 2.8,    // 固定零售价工费系数
      fixedLaborFactorWholesale: 2.1, // 固定批发价工费系数
      materialLoss: 1.12,            // 材料损耗系数
      materialCost: 1.00,             // 材料浮动系数
      profitMargin: 1.35,             // 关税系数
    };

    // 保存默认系数
    await appConfigManager.setConfig(user.id, 'priceCoefficients', defaultCoefficients);

    // 默认金价
    const defaultGoldPrice = 500;

    await appConfigManager.setConfig(user.id, 'goldPrice', defaultGoldPrice);

    // 默认数据版本
    const defaultDataVersion = 1;

    await appConfigManager.setConfig(user.id, 'dataVersion', defaultDataVersion);

    return NextResponse.json({
      success: true,
      message: 'Configuration initialized successfully',
      coefficients: defaultCoefficients,
      goldPrice: defaultGoldPrice,
    });
  } catch (error) {
    console.error('Init config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
