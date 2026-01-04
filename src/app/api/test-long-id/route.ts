import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { priceHistoryManager } from '@/storage/database/priceHistoryManager';

/**
 * POST /api/test-long-id - 测试插入长ID
 * Body:
 * - testId: 要测试的ID
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testId } = body;

    console.log('🧪 测试插入长ID:', testId);
    console.log('ID长度:', testId?.length);

    // 构造测试数据
    const testData = {
      id: testId,
      productId: testId,
      productCode: 'TEST',
      productName: 'test',
      category: 'accessories',
      subCategory: '',
      karat: '14K',
      goldColor: 'gold',
      weight: 1.0,
      laborCost: 100,
      goldPrice: 500,
      wholesalePrice: 600,
      retailPrice: 700,
      timestamp: new Date(),
    };

    // 尝试插入测试数据
    try {
      await priceHistoryManager.createPriceHistoryWithId(user.id, testData);
      console.log('✅ 插入成功');

      // 删除测试数据
      await priceHistoryManager.deleteHistory(testId, user.id);
      console.log('✅ 删除测试数据成功');

      return NextResponse.json({
        success: true,
        message: '测试成功！长ID可以正常插入',
        testId: testId,
        idLength: testId?.length,
      });
    } catch (insertError: any) {
      console.error('❌ 插入失败:', insertError.message);
      console.error('错误代码:', insertError.code);
      console.error('错误详情:', insertError.detail);

      return NextResponse.json({
        success: false,
        message: '插入失败',
        testId: testId,
        idLength: testId?.length,
        error: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
      });
    }
  } catch (error: any) {
    console.error('❌ 测试失败:', error);
    return NextResponse.json(
      { error: error.message || '测试失败', details: error.toString() },
      { status: 500 }
    );
  }
}
