import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';

/**
 * POST /api/fix-schema - 修复数据库表结构，支持长ID
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 开始修复数据库表结构...');

    const db = await getDb();
    const results = {
      tablesFixed: [] as string[],
      errors: [] as string[],
    };

    // 检查并修复 products.id 字段
    try {
      console.log('📝 检查 products.id 字段...');
      const result = await db.execute(sql`
        SELECT character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'products'
          AND column_name = 'id'
      `);

      const currentLength = result.rows[0]?.character_maximum_length as number | undefined;
      console.log(`  当前长度: ${currentLength}`);

      if (currentLength !== undefined && currentLength < 200) {
        console.log('  修改 products.id 为 varchar(200)...');
        await db.execute(sql`ALTER TABLE products ALTER COLUMN id TYPE varchar(200)`);
        results.tablesFixed.push('products.id -> varchar(200)');
        console.log('  ✅ 修改成功');
      } else {
        console.log('  ✅ 长度已足够，无需修改');
      }
    } catch (e: any) {
      const error = `修复 products.id 失败: ${e.message}`;
      results.errors.push(error);
      console.error('  ❌', error);
    }

    // 检查并修复 price_history.id 字段
    try {
      console.log('📝 检查 price_history.id 字段...');
      const result = await db.execute(sql`
        SELECT character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'price_history'
          AND column_name = 'id'
      `);

      const currentLength = result.rows[0]?.character_maximum_length as number | undefined;
      console.log(`  当前长度: ${currentLength}`);

      if (currentLength !== undefined && currentLength < 200) {
        console.log('  修改 price_history.id 为 varchar(200)...');
        await db.execute(sql`ALTER TABLE price_history ALTER COLUMN id TYPE varchar(200)`);
        results.tablesFixed.push('price_history.id -> varchar(200)');
        console.log('  ✅ 修改成功');
      } else {
        console.log('  ✅ 长度已足够，无需修改');
      }
    } catch (e: any) {
      const error = `修复 price_history.id 失败: ${e.message}`;
      results.errors.push(error);
      console.error('  ❌', error);
    }

    // 检查并修复 price_history.product_id 字段
    try {
      console.log('📝 检查 price_history.product_id 字段...');
      const result = await db.execute(sql`
        SELECT character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'price_history'
          AND column_name = 'product_id'
      `);

      const currentLength = result.rows[0]?.character_maximum_length as number | undefined;
      console.log(`  当前长度: ${currentLength}`);

      if (currentLength !== undefined && currentLength < 200) {
        console.log('  修改 price_history.product_id 为 varchar(200)...');
        await db.execute(sql`ALTER TABLE price_history ALTER COLUMN product_id TYPE varchar(200)`);
        results.tablesFixed.push('price_history.product_id -> varchar(200)');
        console.log('  ✅ 修改成功');
      } else {
        console.log('  ✅ 长度已足够，无需修改');
      }
    } catch (e: any) {
      const error = `修复 price_history.product_id 失败: ${e.message}`;
      results.errors.push(error);
      console.error('  ❌', error);
    }

    console.log('🔧 表结构修复完成');

    return NextResponse.json({
      success: results.errors.length === 0,
      message: '表结构修复完成',
      results,
    });
  } catch (error: any) {
    console.error('❌ 修复失败:', error);
    return NextResponse.json(
      { error: error.message || '修复失败', details: error.toString() },
      { status: 500 }
    );
  }
}
