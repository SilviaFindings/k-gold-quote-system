import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';

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

    const db = await getDb();

    // 1. 检查表结构
    const structureQuery = sql`
      SELECT
        column_name,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'price_history'
        AND column_name = 'id'
    `;
    const structure = await db.execute(structureQuery);
    const idMaxLength = structure.rows[0]?.character_maximum_length;
    console.log('price_history.id 最大长度:', idMaxLength);

    // 2. 尝试插入测试数据
    try {
      const insertQuery = sql`
        INSERT INTO price_history (id, product_id, product_code, product_name, category, sub_category, karat, gold_color, weight, labor_cost, gold_price, wholesale_price, retail_price, user_id, timestamp)
        VALUES (${testId}, ${testId}, 'TEST', 'test', 'accessories', '', '14K', 'gold', 1.0, 100, 500, 600, 700, ${user.id}, NOW())
      `;
      await db.execute(insertQuery);

      console.log('✅ 插入成功');

      // 3. 删除测试数据
      await db.execute(sql`DELETE FROM price_history WHERE id = ${testId}`);
      console.log('✅ 删除测试数据成功');

      return NextResponse.json({
        success: true,
        message: '测试成功！长ID可以正常插入',
        testId: testId,
        idLength: testId?.length,
        idMaxLength: idMaxLength,
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
        idMaxLength: idMaxLength,
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
