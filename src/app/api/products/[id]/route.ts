import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager, priceHistoryManager } from '@/storage/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/products/[id] - 获取单个产品
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await isAuthenticated(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const product = await productManager.getProductById(id, user.id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

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

    return NextResponse.json({ product: normalizedProduct });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/products/[id] - 更新产品
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await isAuthenticated(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 更新产品
    const product = await productManager.updateProduct(id, user.id, body);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

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

    return NextResponse.json({ product: normalizedProduct });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id] - 删除产品
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await isAuthenticated(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await productManager.deleteProduct(id, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
