import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import { isAuthenticated } from '@/lib/auth';

/**
 * POST /api/force-fix-db - 强制修复数据库表结构
 * 使用原始SQL修改表结构，不依赖Drizzle ORM
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 强制修复数据库表结构...');

    const db = await getDb();

    // 步骤1: 检查当前表结构
    console.log('📊 检查当前表结构...');
    const checkQuery = sql`
      SELECT
        table_name,
        column_name,
        data_type,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name IN ('products', 'price_history')
        AND column_name IN ('id', 'product_id')
      ORDER BY table_name, column_name
    `;

    const currentStructure = await db.execute(checkQuery);
    console.log('当前表结构:', currentStructure.rows);

    // 步骤2: 尝试修改 price_history.id 字段到 200 字符
    console.log('📝 修改 price_history.id 字段到 varchar(200)...');
    try {
      await db.execute(sql`ALTER TABLE price_history ALTER COLUMN id TYPE varchar(200)`);
      console.log('✅ price_history.id 修改成功');
    } catch (e: any) {
      console.error('❌ price_history.id 修改失败:', e.message);
    }

    // 步骤3: 尝试修改 price_history.product_id 字段到 200 字符
    console.log('📝 修改 price_history.product_id 字段到 varchar(200)...');
    try {
      await db.execute(sql`ALTER TABLE price_history ALTER COLUMN product_id TYPE varchar(200)`);
      console.log('✅ price_history.product_id 修改成功');
    } catch (e: any) {
      console.error('❌ price_history.product_id 修改失败:', e.message);
    }

    // 步骤4: 尝试修改 products.id 字段到 200 字符
    console.log('📝 修改 products.id 字段到 varchar(200)...');
    try {
      await db.execute(sql`ALTER TABLE products ALTER COLUMN id TYPE varchar(200)`);
      console.log('✅ products.id 修改成功');
    } catch (e: any) {
      console.error('❌ products.id 修改失败:', e.message);
    }

    // 步骤5: 再次检查表结构
    const afterFix = await db.execute(checkQuery);
    console.log('修复后表结构:', afterFix.rows);

    // 步骤6: 验证修复结果
    const productsIdLength = afterFix.rows.find((r: any) => r.table_name === 'products' && r.column_name === 'id')?.character_maximum_length as number;
    const priceHistoryIdLength = afterFix.rows.find((r: any) => r.table_name === 'price_history' && r.column_name === 'id')?.character_maximum_length as number;
    const priceHistoryProductIdLength = afterFix.rows.find((r: any) => r.table_name === 'price_history' && r.column_name === 'product_id')?.character_maximum_length as number;

    const isFixed = productsIdLength >= 200 && priceHistoryIdLength >= 200 && priceHistoryProductIdLength >= 200;

    console.log('✅ 数据库修复完成！', {
      productsId: productsIdLength,
      priceHistoryId: priceHistoryIdLength,
      priceHistoryProductId: priceHistoryProductIdLength,
      isFixed,
    });

    return NextResponse.json({
      success: true,
      message: isFixed ? '数据库表结构修复成功！' : '数据库表结构可能仍有问题',
      fixed: isFixed,
      before: currentStructure.rows,
      after: afterFix.rows,
      details: {
        productsIdLength,
        priceHistoryIdLength,
        priceHistoryProductIdLength,
      },
    });
  } catch (error: any) {
    console.error('❌ 数据库修复失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);

    return NextResponse.json(
      {
        error: '数据库修复失败',
        message: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
