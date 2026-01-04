import { eq, and, desc } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { priceHistory, insertPriceHistorySchema, insertPriceHistoryWithIdSchema } from "./shared/schema";
import type { PriceHistory, InsertPriceHistory } from "./shared/schema";

export class PriceHistoryManager {
  async createPriceHistory(userId: string, data: InsertPriceHistory): Promise<PriceHistory> {
    const db = await getDb();
    const validated = insertPriceHistorySchema.parse({ ...data });
    const [history] = await db.insert(priceHistory).values({ ...validated, userId }).returning();
    return history;
  }

  // 创建价格历史并指定 ID（用于同步）
  async createPriceHistoryWithId(userId: string, data: any): Promise<PriceHistory> {
    const db = await getDb();

    // 绕过验证，直接插入数据（用于同步，ID可能超过36字符限制）
    // 数据已经在同步API中进行了预处理和验证

    try {
      const [history] = await db.insert(priceHistory).values({ ...data, userId }).returning();
      return history;
    } catch (error: any) {
      console.error('❌ 插入价格历史失败:', {
        id: data.id,
        productId: data.productId,
        idLength: data.id ? String(data.id).length : 0,
        productIdLength: data.productId ? String(data.productId).length : 0,
        error: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail,
      });
      throw error;
    }
  }

  async getHistoryByUserId(userId: string, options: {
    skip?: number;
    limit?: number;
    productId?: string;
  } = {}): Promise<PriceHistory[]> {
    const { skip = 0, limit = 100, productId } = options;
    const db = await getDb();

    const conditions = [eq(priceHistory.userId, userId)];
    if (productId !== undefined) {
      conditions.push(eq(priceHistory.productId, productId));
    }

    return db
      .select()
      .from(priceHistory)
      .where(and(...conditions))
      .orderBy(desc(priceHistory.timestamp))
      .limit(limit)
      .offset(skip);
  }

  async getHistoryByProductId(productId: string, userId: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<PriceHistory[]> {
    const { skip = 0, limit = 100 } = options;
    const db = await getDb();

    return db
      .select()
      .from(priceHistory)
      .where(and(
        eq(priceHistory.productId, productId),
        eq(priceHistory.userId, userId)
      ))
      .orderBy(desc(priceHistory.timestamp))
      .limit(limit)
      .offset(skip);
  }

  async getHistoryById(id: string, userId: string): Promise<PriceHistory | null> {
    const db = await getDb();
    const [history] = await db
      .select()
      .from(priceHistory)
      .where(and(
        eq(priceHistory.id, id),
        eq(priceHistory.userId, userId)
      ));
    return history || null;
  }

  async deleteHistory(id: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(priceHistory)
      .where(and(
        eq(priceHistory.id, id),
        eq(priceHistory.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllHistory(userId: string): Promise<number> {
    const db = await getDb();
    const result = await db
      .delete(priceHistory)
      .where(eq(priceHistory.userId, userId));
    return result.rowCount ?? 0;
  }

  async deleteHistoryByProductId(productId: string, userId: string): Promise<number> {
    const db = await getDb();
    const result = await db
      .delete(priceHistory)
      .where(and(
        eq(priceHistory.productId, productId),
        eq(priceHistory.userId, userId)
      ));
    return result.rowCount ?? 0;
  }
}

export const priceHistoryManager = new PriceHistoryManager();
