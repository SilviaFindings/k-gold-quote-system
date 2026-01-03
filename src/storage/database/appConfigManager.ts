import { eq, and } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { appConfig, insertAppConfigSchema, updateAppConfigSchema } from "./shared/schema";
import type { AppConfig, InsertAppConfig, UpdateAppConfig } from "./shared/schema";

export class AppConfigManager {
  async createConfig(userId: string, data: InsertAppConfig): Promise<AppConfig> {
    const db = await getDb();
    const validated = insertAppConfigSchema.parse({ ...data });
    const [config] = await db.insert(appConfig).values({ ...validated, userId }).returning();
    return config;
  }

  async getConfig(userId: string, configKey: string): Promise<AppConfig | null> {
    const db = await getDb();
    const [config] = await db
      .select()
      .from(appConfig)
      .where(and(
        eq(appConfig.userId, userId),
        eq(appConfig.configKey, configKey)
      ));
    return config || null;
  }

  async setConfig(userId: string, configKey: string, configValue: any): Promise<AppConfig> {
    const db = await getDb();
    const existing = await this.getConfig(userId, configKey);

    if (existing) {
      const [config] = await db
        .update(appConfig)
        .set({ configValue, updatedAt: new Date() })
        .where(and(
          eq(appConfig.userId, userId),
          eq(appConfig.configKey, configKey)
        ))
        .returning();
      return config!;
    } else {
      return this.createConfig(userId, { configKey, configValue });
    }
  }

  async getAllConfigs(userId: string): Promise<AppConfig[]> {
    const db = await getDb();
    return db
      .select()
      .from(appConfig)
      .where(eq(appConfig.userId, userId));
  }

  async deleteConfig(userId: string, configKey: string): Promise<boolean> {
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
