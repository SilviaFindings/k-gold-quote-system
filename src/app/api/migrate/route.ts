import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import { isAuthenticated } from '@/lib/auth';

/**
 * POST /api/migrate - 执行数据库迁移
 * 安全地增加ID字段长度限制
 */
export async function POST(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 开始执行数据库迁移...');

    const db = await getDb();

    // 检查当前ID字段长度
    const checkQuery = sql`
      SELECT
        table_name,
        column_name,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name IN ('products', 'price_history')
        AND column_name IN ('id', 'product_id')
      ORDER BY table_name, column_name
    `;

    const currentLengths = await db.execute(checkQuery);
    console.log('📊 当前字段长度:', currentLengths.rows);

    // 检查是否需要迁移
    const needsMigration = currentLengths.rows.some((row: any) => {
      const field = `${row.table_name}.${row.column_name}`;
      const currentLength = parseInt(row.character_maximum_length);
      console.log(`  ${field}: ${currentLength} 字符`);
      return currentLength < 100;
    });

    if (!needsMigration) {
      console.log('✅ 数据库已经是最新的，无需迁移');
      return NextResponse.json({
        success: true,
        message: '数据库已经是最新的',
        migrated: false,
      });
    }

    console.log('⚠️ 需要执行数据库迁移...');

    // 执行迁移
    console.log('  - 修改 price_history.id 字段...');
    await db.execute(sql`ALTER TABLE price_history ALTER COLUMN id TYPE varchar(100)`);

    console.log('  - 修改 products.id 字段...');
    await db.execute(sql`ALTER TABLE products ALTER COLUMN id TYPE varchar(100)`);

    console.log('  - 修改 price_history.product_id 字段...');
    await db.execute(sql`ALTER TABLE price_history ALTER COLUMN product_id TYPE varchar(100)`);

    // 验证迁移结果
    const afterMigration = await db.execute(checkQuery);
    console.log('✅ 迁移后字段长度:', afterMigration.rows);

    console.log('🎉 数据库迁移完成！');

    return NextResponse.json({
      success: true,
      message: '数据库迁移成功完成',
      migrated: true,
      before: currentLengths.rows,
      after: afterMigration.rows,
    });
  } catch (error: any) {
    console.error('❌ 数据库迁移失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);

    return NextResponse.json(
      {
        error: '数据库迁移失败',
        message: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
