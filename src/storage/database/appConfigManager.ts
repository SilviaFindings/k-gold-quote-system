import { eq, and } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { appConfig, insertAppConfigSchema, updateAppConfigSchema } from "./shared/schema";
import { sql } from "drizzle-orm";
import type { AppConfig, InsertAppConfig, UpdateAppConfig } from "./shared/schema";

/**
 * 确保 app_config 表存在
 */
async function ensureTableExists() {
  try {
    const db = await getDb();

    // 检查表是否存在
    const checkResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'app_config'
    `);

    if (checkResult.rows.length === 0) {
      console.log('🔧 app_config 表不存在，正在创建...');

      // 创建表
      await db.execute(sql`
        CREATE TABLE app_config (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL,
          config_key VARCHAR(100) NOT NULL,
          config_value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);

      // 创建索引
      await db.execute(sql`
        CREATE INDEX app_config_user_id_key_idx
        ON app_config USING btree (user_id, config_key);
      `);

      // 尝试创建外键（如果 users 表存在）
      try {
        await db.execute(sql`
          ALTER TABLE app_config
          ADD CONSTRAINT app_config_user_id_users_id_fk
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        `);
        console.log('  ✅ 外键创建成功');
      } catch (fkError: any) {
        // 如果外键创建失败（可能是因为 users 表还不存在），只记录警告
        console.warn('  ⚠️ 外键创建失败（可能 users 表还不存在）:', fkError.message);
      }

      console.log('✅ app_config 表创建成功');
    }
  } catch (error: any) {
    console.error('❌ 创建 app_config 表失败:', error.message);
    throw error;
  }
}

export class AppConfigManager {
  async createConfig(userId: string, data: InsertAppConfig): Promise<AppConfig> {
    await ensureTableExists();
    const db = await getDb();
    const validated = insertAppConfigSchema.parse({ ...data });
    const [config] = await db.insert(appConfig).values({ ...validated, userId }).returning();
    return config;
  }

  async getConfig(userId: string, configKey: string): Promise<AppConfig | null> {
    try {
      await ensureTableExists();
      const db = await getDb();
      const [config] = await db
        .select()
        .from(appConfig)
        .where(and(
          eq(appConfig.userId, userId),
          eq(appConfig.configKey, configKey)
        ));
      return config || null;
    } catch (error: any) {
      console.error(`❌ getConfig 失败 (userId: ${userId}, configKey: ${configKey}):`, error.message);
      throw error;
    }
  }

  async setConfig(userId: string, configKey: string, configValue: any): Promise<AppConfig> {
    await ensureTableExists();
    const db = await getDb();
    const existing = await this.getConfig(userId, configKey);

    if (existing) {
      const [config] = await db
        .update(appConfig)
        .set({ configValue, updatedAt: new Date().toISOString() })
        .where(and(
          eq(appConfig.userId, userId),
          eq(appConfig.configKey, configKey)
        ))
        .returning();
      return config!;
    } else {
      const validated = insertAppConfigSchema.parse({ configKey, configValue });
      const [config] = await db.insert(appConfig).values({ ...validated, userId }).returning();
      return config;
    }
  }

  async getAllConfigs(userId: string): Promise<AppConfig[]> {
    await ensureTableExists();
    const db = await getDb();
    return db
      .select()
      .from(appConfig)
      .where(eq(appConfig.userId, userId));
  }

  async deleteConfig(userId: string, configKey: string): Promise<boolean> {
    await ensureTableExists();
    const db = await getDb();
    const result = await db
      .delete(appConfig)
      .where(and(
        eq(appConfig.userId, userId),
        eq(appConfig.configKey, configKey)
      ));
    return (result.rowCount ?? 0) > 0;
  }
}

export const appConfigManager = new AppConfigManager();
