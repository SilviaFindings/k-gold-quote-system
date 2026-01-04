import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import { isAuthenticated } from '@/lib/auth';

/**
 * GET /api/check-table - 检查数据库表结构
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // 1. 检查表结构
    const structureQuery = sql`
      SELECT
        table_name,
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name IN ('products', 'price_history')
        AND column_name IN ('id', 'product_id')
      ORDER BY table_name, column_name
    `;

    const structure = await db.execute(structureQuery);

    // 2. 检查约束
    const constraintQuery = sql`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name IN ('products', 'price_history')
      ORDER BY tc.table_name, tc.constraint_name
    `;

    const constraints = await db.execute(constraintQuery);

    // 3. 检查索引
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

    return NextResponse.json({
      success: true,
      structure: structure.rows,
      constraints: constraints.rows,
      indexes: indexes.rows,
    });
  } catch (error: any) {
    console.error('❌ 检查表结构失败:', error);
    return NextResponse.json(
      { error: error.message || '检查表结构失败', details: error.toString() },
      { status: 500 }
    );
  }
}
