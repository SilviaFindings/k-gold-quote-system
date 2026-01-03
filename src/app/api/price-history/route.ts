import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { priceHistoryManager } from '@/storage/database';

/**
 * GET /api/price-history - 获取价格历史记录
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const history = await priceHistoryManager.getHistoryByUserId(user.id, {
      skip,
      limit,
      productId,
    });

    // 转换数字字段
    const normalizedHistory = history.map(h => ({
      ...h,
      weight: parseFloat(h.weight as any),
      laborCost: parseFloat(h.laborCost as any),
      goldPrice: parseFloat(h.goldPrice as any),
      wholesalePrice: parseFloat(h.wholesalePrice as any),
      retailPrice: parseFloat(h.retailPrice as any),
      accessoryCost: parseFloat(h.accessoryCost as any),
      stoneCost: parseFloat(h.stoneCost as any),
      platingCost: parseFloat(h.platingCost as any),
      moldCost: parseFloat(h.moldCost as any),
      commission: parseFloat(h.commission as any),
      specialMaterialLoss: h.specialMaterialLoss ? parseFloat(h.specialMaterialLoss as any) : undefined,
      specialMaterialCost: h.specialMaterialCost ? parseFloat(h.specialMaterialCost as any) : undefined,
      specialProfitMargin: h.specialProfitMargin ? parseFloat(h.specialProfitMargin as any) : undefined,
      specialLaborFactorRetail: h.specialLaborFactorRetail ? parseFloat(h.specialLaborFactorRetail as any) : undefined,
      specialLaborFactorWholesale: h.specialLaborFactorWholesale ? parseFloat(h.specialLaborFactorWholesale as any) : undefined,
    }));

    return NextResponse.json({ history: normalizedHistory });
  } catch (error) {
    console.error('Get price history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/price-history - 创建价格历史记录
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const history = await priceHistoryManager.createPriceHistory(user.id, body);

    // 转换数字字段
    const normalizedHistory = {
      ...history,
      weight: parseFloat(history.weight as any),
      laborCost: parseFloat(history.laborCost as any),
      goldPrice: parseFloat(history.goldPrice as any),
      wholesalePrice: parseFloat(history.wholesalePrice as any),
      retailPrice: parseFloat(history.retailPrice as any),
      accessoryCost: parseFloat(history.accessoryCost as any),
      stoneCost: parseFloat(history.stoneCost as any),
      platingCost: parseFloat(history.platingCost as any),
      moldCost: parseFloat(history.moldCost as any),
      commission: parseFloat(history.commission as any),
      specialMaterialLoss: history.specialMaterialLoss ? parseFloat(history.specialMaterialLoss as any) : undefined,
      specialMaterialCost: history.specialMaterialCost ? parseFloat(history.specialMaterialCost as any) : undefined,
      specialProfitMargin: history.specialProfitMargin ? parseFloat(history.specialProfitMargin as any) : undefined,
      specialLaborFactorRetail: history.specialLaborFactorRetail ? parseFloat(history.specialLaborFactorRetail as any) : undefined,
      specialLaborFactorWholesale: history.specialLaborFactorWholesale ? parseFloat(history.specialLaborFactorWholesale as any) : undefined,
    };

    return NextResponse.json({ history: normalizedHistory }, { status: 201 });
  } catch (error: any) {
    console.error('Create price history error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
