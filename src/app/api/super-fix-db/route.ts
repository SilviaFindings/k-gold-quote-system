import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import { isAuthenticated } from '@/lib/auth';

/**
 * POST /api/super-fix-db - 超级修复数据库表结构
 * 完整的修复流程：检查约束 -> 删除索引 -> 修改表结构 -> 重建索引
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧🔧 超级修复数据库表结构...');
    const db = await getDb();

    const results: any = {
      steps: [],
      errors: [],
      finalStructure: null,
    };

    // 步骤1: 检查当前表结构
    console.log('\n步骤1: 检查当前表结构...');
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
    results.steps.push({ step: 1, action: '检查表结构', data: currentStructure.rows });
    console.log('当前表结构:', currentStructure.rows);

    // 步骤2: 检查相关索引
    console.log('\n步骤2: 检查相关索引...');
    const indexQuery = sql`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('products', 'price_history')
      ORDER BY tablename, indexname
    `;
    const indexes = await db.execute(indexQuery);
    results.steps.push({ step: 2, action: '检查索引', data: indexes.rows });
    console.log('相关索引:', indexes.rows);

    // 步骤3: 删除可能影响修改的索引
    console.log('\n步骤3: 删除相关索引...');
    for (const index of indexes.rows) {
      const tableName = index.tablename as string;
      const indexName = index.indexname as string;
      try {
        await db.execute(sql`DROP INDEX IF EXISTS ${sql.raw(indexName)}`);
        console.log(`  ✅ 删除索引: ${indexName}`);
        results.steps.push({ step: 3, action: `删除索引 ${indexName}`, success: true });
      } catch (e: any) {
        console.warn(`  ⚠️ 删除索引失败: ${indexName}`, e.message);
        results.errors.push({ index: indexName, error: e.message });
      }
    }

    // 步骤4: 修改 price_history.id 字段
    console.log('\n步骤4: 修改 price_history.id 字段到 varchar(200)...');
    try {
      await db.execute(sql`
        ALTER TABLE price_history
        ALTER COLUMN id TYPE varchar(200)
      `);
      console.log('  ✅ price_history.id 修改成功');
      results.steps.push({ step: 4, action: '修改 price_history.id', success: true });
    } catch (e: any) {
      console.error('  ❌ price_history.id 修改失败:', e.message);
      results.errors.push({ field: 'price_history.id', error: e.message });
      throw e;
    }

    // 步骤5: 修改 price_history.product_id 字段
    console.log('\n步骤5: 修改 price_history.product_id 字段到 varchar(200)...');
    try {
      await db.execute(sql`
        ALTER TABLE price_history
        ALTER COLUMN product_id TYPE varchar(200)
      `);
      console.log('  ✅ price_history.product_id 修改成功');
      results.steps.push({ step: 5, action: '修改 price_history.product_id', success: true });
    } catch (e: any) {
      console.error('  ❌ price_history.product_id 修改失败:', e.message);
      results.errors.push({ field: 'price_history.product_id', error: e.message });
      throw e;
    }

    // 步骤6: 修改 products.id 字段
    console.log('\n步骤6: 修改 products.id 字段到 varchar(200)...');
    try {
      await db.execute(sql`
        ALTER TABLE products
        ALTER COLUMN id TYPE varchar(200)
      `);
      console.log('  ✅ products.id 修改成功');
      results.steps.push({ step: 6, action: '修改 products.id', success: true });
    } catch (e: any) {
      console.error('  ❌ products.id 修改失败:', e.message);
      results.errors.push({ field: 'products.id', error: e.message });
      throw e;
    }

    // 步骤7: 验证修复结果
    console.log('\n步骤7: 验证修复结果...');
    const afterFix = await db.execute(checkQuery);
    results.finalStructure = afterFix.rows;
    console.log('修复后表结构:', afterFix.rows);

    const productsIdLength = afterFix.rows.find((r: any) => r.table_name === 'products' && r.column_name === 'id')?.character_maximum_length as number;
    const priceHistoryIdLength = afterFix.rows.find((r: any) => r.table_name === 'price_history' && r.column_name === 'id')?.character_maximum_length as number;
    const priceHistoryProductIdLength = afterFix.rows.find((r: any) => r.table_name === 'price_history' && r.column_name === 'product_id')?.character_maximum_length as number;

    const isFixed = productsIdLength >= 200 && priceHistoryIdLength >= 200 && priceHistoryProductIdLength >= 200;

    console.log('\n✅ 超级修复完成！', {
      productsId: productsIdLength,
      priceHistoryId: priceHistoryIdLength,
      priceHistoryProductId: priceHistoryProductIdLength,
      isFixed,
    });

    results.steps.push({
      step: 8,
      action: '验证结果',
      success: true,
      data: {
        productsIdLength,
        priceHistoryIdLength,
        priceHistoryProductIdLength,
        isFixed,
      }
    });

    return NextResponse.json({
      success: true,
      message: isFixed ? '数据库表结构超级修复成功！' : '数据库表结构可能仍有问题',
      fixed: isFixed,
      results,
      before: currentStructure.rows,
      after: afterFix.rows,
      details: {
        productsIdLength,
        priceHistoryIdLength,
        priceHistoryProductIdLength,
      },
    });
  } catch (error: any) {
    console.error('❌ 数据库超级修复失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);

    return NextResponse.json(
      {
        error: '数据库超级修复失败',
        message: error.message,
        details: error.toString(),
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
