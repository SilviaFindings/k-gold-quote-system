import { getDb } from 'coze-coding-dev-sdk';
import { products } from './storage/database/shared/schema';
import { eq } from 'drizzle-orm';

async function testDbInsert() {
  try {
    console.log('🔧 开始测试数据库插入...');
    const db = await getDb();

    // 尝试插入一个测试产品
    const testProduct = {
      id: 'test_product_' + Date.now(),
      userId: 'test_user',
      category: '配件',
      subCategory: '耳环/耳逼',
      productCode: 'TEST001',
      productName: '测试产品',
      specification: '测试规格',
      weight: '1.5',
      laborCost: '10.00',
      karat: '14K',
      goldColor: '黄金',
      goldPrice: '500.00',
      wholesalePrice: '100.00',
      retailPrice: '150.00',
      accessoryCost: '5.00',
      stoneCost: '0.00',
      platingCost: '2.00',
      moldCost: '0.00',
      commission: '0.00',
      supplierCode: 'SUP001',
      laborCostDate: new Date(),
      accessoryCostDate: new Date(),
      stoneCostDate: new Date(),
      platingCostDate: new Date(),
      moldCostDate: new Date(),
      commissionDate: new Date(),
      timestamp: new Date(),
    };

    console.log('📝 插入测试产品:', testProduct.id);
    const [inserted] = await db.insert(products).values(testProduct).returning();
    console.log('✅ 插入成功:', inserted.id, inserted.productCode);

    // 查询测试产品
    const [queried] = await db.select().from(products).where(eq(products.id, inserted.id));
    console.log('✅ 查询成功:', queried.productCode, queried.productName);

    // 删除测试产品
    await db.delete(products).where(eq(products.id, inserted.id));
    console.log('✅ 删除成功');

    console.log('🎉 数据库测试完成！');
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    throw error;
  }
}

testDbInsert();
