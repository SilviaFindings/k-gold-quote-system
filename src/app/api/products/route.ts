import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager, priceHistoryManager } from '@/storage/database';

/**
 * GET /api/products - 获取产品列表
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const subCategory = searchParams.get('subCategory') || undefined;
    const productCode = searchParams.get('productCode') || undefined;
    const karat = searchParams.get('karat') || undefined;
    const goldColor = searchParams.get('goldColor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const products = await productManager.getProducts(user.id, {
      skip,
      limit,
      filters: {
        category: category as any,
        subCategory,
        productCode,
        karat: karat as any,
        goldColor: goldColor as any,
      },
    });

    // 转换数字字段（PostgreSQL numeric 返回为 string）
    const normalizedProducts = products.map(p => ({
      ...p,
      weight: parseFloat(p.weight as any),
      laborCost: parseFloat(p.laborCost as any),
      goldPrice: parseFloat(p.goldPrice as any),
      wholesalePrice: parseFloat(p.wholesalePrice as any),
      retailPrice: parseFloat(p.retailPrice as any),
      accessoryCost: parseFloat(p.accessoryCost as any),
      stoneCost: parseFloat(p.stoneCost as any),
      platingCost: parseFloat(p.platingCost as any),
      moldCost: parseFloat(p.moldCost as any),
      commission: parseFloat(p.commission as any),
      specialMaterialLoss: p.specialMaterialLoss ? parseFloat(p.specialMaterialLoss as any) : undefined,
      specialMaterialCost: p.specialMaterialCost ? parseFloat(p.specialMaterialCost as any) : undefined,
      specialProfitMargin: p.specialProfitMargin ? parseFloat(p.specialProfitMargin as any) : undefined,
      specialLaborFactorRetail: p.specialLaborFactorRetail ? parseFloat(p.specialLaborFactorRetail as any) : undefined,
      specialLaborFactorWholesale: p.specialLaborFactorWholesale ? parseFloat(p.specialLaborFactorWholesale as any) : undefined,
    }));

    return NextResponse.json({ products: normalizedProducts });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/products - 创建新产品
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const product = await productManager.createProduct(user.id, body);

    // 转换数字字段
    const normalizedProduct = {
      ...product,
      weight: parseFloat(product.weight as any),
      laborCost: parseFloat(product.laborCost as any),
      goldPrice: parseFloat(product.goldPrice as any),
      wholesalePrice: parseFloat(product.wholesalePrice as any),
      retailPrice: parseFloat(product.retailPrice as any),
      accessoryCost: parseFloat(product.accessoryCost as any),
      stoneCost: parseFloat(product.stoneCost as any),
      platingCost: parseFloat(product.platingCost as any),
      moldCost: parseFloat(product.moldCost as any),
      commission: parseFloat(product.commission as any),
      specialMaterialLoss: product.specialMaterialLoss ? parseFloat(product.specialMaterialLoss as any) : undefined,
      specialMaterialCost: product.specialMaterialCost ? parseFloat(product.specialMaterialCost as any) : undefined,
      specialProfitMargin: product.specialProfitMargin ? parseFloat(product.specialProfitMargin as any) : undefined,
      specialLaborFactorRetail: product.specialLaborFactorRetail ? parseFloat(product.specialLaborFactorRetail as any) : undefined,
      specialLaborFactorWholesale: product.specialLaborFactorWholesale ? parseFloat(product.specialLaborFactorWholesale as any) : undefined,
    };

    return NextResponse.json({ product: normalizedProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
