import { eq, and, SQL, like, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { products, insertProductSchema, insertProductWithIdSchema, updateProductSchema } from "./shared/schema";
import type { Product, InsertProduct, UpdateProduct } from "./shared/schema";

export class ProductManager {
  async createProduct(userId: string, data: InsertProduct): Promise<Product> {
    const db = await getDb();
    const validated = insertProductSchema.parse({ ...data });
    const [product] = await db.insert(products).values({ ...validated, userId }).returning();
    return product;
  }

  // 创建产品并指定 ID（用于同步）
  async createProductWithId(userId: string, data: any): Promise<Product> {
    const db = await getDb();
    // 如果数据中包含 id，使用 insertProductWithIdSchema，否则使用 insertProductSchema
    const schema = data.id ? insertProductWithIdSchema : insertProductSchema;
    const validated = schema.parse({ ...data });
    const [product] = await db.insert(products).values({ ...validated, userId }).returning();
    return product;
  }

  async getProducts(userId: string, options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Product, 'id' | 'category' | 'subCategory' | 'productCode' | 'karat' | 'goldColor'>>;
  } = {}): Promise<Product[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [eq(products.userId, userId)];

    if (filters.id !== undefined) {
      conditions.push(eq(products.id, filters.id));
    }
    if (filters.category !== undefined) {
      conditions.push(eq(products.category, filters.category));
    }
    if (filters.subCategory !== undefined) {
      conditions.push(eq(products.subCategory, filters.subCategory));
    }
    if (filters.productCode !== undefined) {
      conditions.push(like(products.productCode, `%${filters.productCode}%`));
    }
    if (filters.karat !== undefined) {
      conditions.push(eq(products.karat, filters.karat));
    }
    if (filters.goldColor !== undefined) {
      conditions.push(eq(products.goldColor, filters.goldColor));
    }

    return db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(products.productCode)
      .limit(limit)
      .offset(skip);
  }

  async getProductById(id: string, userId: string): Promise<Product | null> {
    const db = await getDb();
    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.id, id),
        eq(products.userId, userId)
      ));
    return product || null;
  }

  async getProductByCode(productCode: string, userId: string): Promise<Product | null> {
    const db = await getDb();
    const [product] = await db
      .select()
      .from(products)
      .where(and(
        eq(products.productCode, productCode),
        eq(products.userId, userId)
      ));
    return product || null;
  }

  async updateProduct(id: string, userId: string, data: UpdateProduct): Promise<Product | null> {
    const db = await getDb();
    const validated = updateProductSchema.parse({ ...data, updatedAt: new Date() });
    const [product] = await db
      .update(products)
      .set(validated)
      .where(and(
        eq(products.id, id),
        eq(products.userId, userId)
      ))
      .returning();
    return product || null;
  }

  async deleteProduct(id: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(products)
      .where(and(
        eq(products.id, id),
        eq(products.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteProducts(ids: string[], userId: string): Promise<number> {
    const db = await getDb();
    const result = await db
      .delete(products)
      .where(and(
        eq(products.userId, userId),
        sql`${products.id} = ANY(${ids})`
      ));
    return result.rowCount ?? 0;
  }

  async batchUpdateProducts(ids: string[], userId: string, updates: UpdateProduct): Promise<number> {
    const db = await getDb();
    const validated = updateProductSchema.parse({ ...updates, updatedAt: new Date() });
    const result = await db
      .update(products)
      .set(validated)
      .where(and(
        eq(products.userId, userId),
        sql`${products.id} = ANY(${ids})`
      ));
    return result.rowCount ?? 0;
  }
}

export const productManager = new ProductManager();
