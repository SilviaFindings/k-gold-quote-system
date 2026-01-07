import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

// 银制品数据类型定义
interface SilverProduct {
  id: string;
  category: string;
  subCategory: string;
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  silverColor: string;
  silverPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  accessoryCost: number;
  stoneCost: number;
  platingCost: number;
  moldCost: number;
  commission: number;
  supplierCode: string;
  remarks: string;
  batchQuantity: number;
  quantity: number;
  quantityDate: string;
  laborCostDate: string;
  accessoryCostDate: string;
  stoneCostDate: string;
  platingCostDate: string;
  moldCostDate: string;
  commissionDate: string;
  timestamp: string;
  syncStatus: "synced" | "unsynced";
}

interface SilverPriceHistory {
  id: string;
  productId: string;
  category: string;
  subCategory: string;
  productCode: string;
  productName: string;
  specification: string;
  weight: number;
  laborCost: number;
  silverColor: string;
  silverPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  accessoryCost: number;
  stoneCost: number;
  platingCost: number;
  moldCost: number;
  commission: number;
  supplierCode: string;
  remarks: string;
  batchQuantity: number;
  quantity: number;
  quantityDate: string;
  laborCostDate: string;
  accessoryCostDate: string;
  stoneCostDate: string;
  platingCostDate: string;
  moldCostDate: string;
  commissionDate: string;
  timestamp: string;
}

// 简单的内存存储（生产环境应该使用数据库）
let silverDataStore: {
  products: SilverProduct[];
  history: SilverPriceHistory[];
  silverPrice: number;
  coefficients: any;
} = {
  products: [],
  history: [],
  silverPrice: 20,
  coefficients: {},
};

/**
 * POST /api/silver-sync - 上传银制品数据到云端
 * Body:
 * - products: 产品数组
 * - priceHistory: 价格历史数组
 * - silverPrice: 银价
 * - coefficients: 系数对象
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { products, priceHistory, silverPrice, coefficients } = body;

    console.log('📥 收到银制品同步请求:', {
      userId: user.id,
      userEmail: user.email,
      productsCount: Array.isArray(products) ? products.length : 0,
      historyCount: Array.isArray(priceHistory) ? priceHistory.length : 0,
    });

    // 存储数据到内存（实际应该使用数据库）
    if (Array.isArray(products)) {
      silverDataStore.products = products;
    }
    if (Array.isArray(priceHistory)) {
      silverDataStore.history = priceHistory;
    }
    if (silverPrice !== undefined) {
      silverDataStore.silverPrice = silverPrice;
    }
    if (coefficients) {
      silverDataStore.coefficients = coefficients;
    }

    console.log('✅ 银制品数据上传成功');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ 银制品同步失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/silver-sync - 从云端下载银制品数据
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📤 发送银制品数据:', {
      userId: user.id,
      userEmail: user.email,
      productsCount: silverDataStore.products.length,
      historyCount: silverDataStore.history.length,
    });

    return NextResponse.json({
      products: silverDataStore.products,
      history: silverDataStore.history,
      silverPrice: silverDataStore.silverPrice,
      coefficients: silverDataStore.coefficients,
    });
  } catch (error) {
    console.error('❌ 银制品下载失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/silver-sync - 清除云端银制品数据
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ 清除银制品数据:', {
      userId: user.id,
      userEmail: user.email,
    });

    silverDataStore = {
      products: [],
      history: [],
      silverPrice: 20,
      coefficients: {},
    };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ 清除银制品数据失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
