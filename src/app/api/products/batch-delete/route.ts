import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { productManager, priceHistoryManager } from '@/storage/database';

/**
 * POST /api/products/batch-delete - 批量删除产品
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const count = await productManager.deleteProducts(ids, user.id);

    return NextResponse.json({ success: true, deletedCount: count });
  } catch (error) {
    console.error('Batch delete products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
