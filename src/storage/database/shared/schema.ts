import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ============================================
// 用户认证相关表
// ============================================

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 128 }).notNull(),
    password: text("password").notNull(),  // 存储 bcrypt 哈希密码
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ============================================
// 业务数据表
// ============================================

// 产品分类枚举
export const PRODUCT_CATEGORIES = ["配件", "宝石托", "链条"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// 金色枚举
export const GOLD_COLORS = ["黄金", "白金", "玫瑰金"] as const;
export type GoldColor = typeof GOLD_COLORS[number];

// 金重枚举
export const KARAT_TYPES = ["10K", "14K", "18K"] as const;
export type KaratType = typeof KARAT_TYPES[number];

// 下单口枚举
export const ORDER_CHANNELS = ["Van", "US201", "US202"] as const;
export type OrderChannel = typeof ORDER_CHANNELS[number];

// 形状枚举
export const PRODUCT_SHAPES = [
  "圆形", "椭圆形", "心形", "方形", "长方形", "马蹄形",
  "水滴形", "菱形", "肥方", "肥三角", "其他", ""
] as const;
export type ProductShape = typeof PRODUCT_SHAPES[number];

export const products = pgTable("products", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),  // ProductCategory
  subCategory: varchar("sub_category", { length: 100 }).notNull(),
  productCode: varchar("product_code", { length: 100 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  specification: varchar("specification", { length: 500 }).notNull(),
  weight: numeric("weight", { precision: 10, scale: 3 }).notNull(),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).notNull(),
  karat: varchar("karat", { length: 10 }).notNull(),  // 10K | 14K | 18K
  goldColor: varchar("gold_color", { length: 20 }).notNull(),  // 黄金 | 白金 | 玫瑰金
  goldPrice: numeric("gold_price", { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: numeric("wholesale_price", { precision: 12, scale: 2 }).notNull(),
  retailPrice: numeric("retail_price", { precision: 12, scale: 2 }).notNull(),
  accessoryCost: numeric("accessory_cost", { precision: 10, scale: 2 }).notNull(),
  stoneCost: numeric("stone_cost", { precision: 10, scale: 2 }).notNull(),
  platingCost: numeric("plating_cost", { precision: 10, scale: 2 }).notNull(),
  moldCost: numeric("mold_cost", { precision: 10, scale: 2 }).notNull(),
  commission: numeric("commission", { precision: 10, scale: 2 }).notNull(),
  supplierCode: varchar("supplier_code", { length: 100 }).notNull(),
  orderChannel: varchar("order_channel", { length: 20 }),  // OrderChannel
  shape: varchar("shape", { length: 50 }),  // ProductShape
  // 特殊系数（可选，如果设置则优先使用）
  specialMaterialLoss: numeric("special_material_loss", { precision: 5, scale: 2 }),
  specialMaterialCost: numeric("special_material_cost", { precision: 5, scale: 2 }),
  specialProfitMargin: numeric("special_profit_margin", { precision: 5, scale: 2 }),
  specialLaborFactorRetail: numeric("special_labor_factor_retail", { precision: 5, scale: 2 }),
  specialLaborFactorWholesale: numeric("special_labor_factor_wholesale", { precision: 5, scale: 2 }),
  // 成本时间戳
  laborCostDate: timestamp("labor_cost_date", { withTimezone: true }).notNull(),
  accessoryCostDate: timestamp("accessory_cost_date", { withTimezone: true }).notNull(),
  stoneCostDate: timestamp("stone_cost_date", { withTimezone: true }).notNull(),
  platingCostDate: timestamp("plating_cost_date", { withTimezone: true }).notNull(),
  moldCostDate: timestamp("mold_cost_date", { withTimezone: true }).notNull(),
  commissionDate: timestamp("commission_date", { withTimezone: true }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  userIdIdx: index("products_user_id_idx").on(table.userId),
  productCodeIdx: index("products_product_code_idx").on(table.productCode),
}));

export const priceHistory = pgTable("price_history", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 })
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  subCategory: varchar("sub_category", { length: 100 }).notNull(),
  productCode: varchar("product_code", { length: 100 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  specification: varchar("specification", { length: 500 }).notNull(),
  weight: numeric("weight", { precision: 10, scale: 3 }).notNull(),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).notNull(),
  karat: varchar("karat", { length: 10 }).notNull(),
  goldColor: varchar("gold_color", { length: 20 }).notNull(),
  goldPrice: numeric("gold_price", { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: numeric("wholesale_price", { precision: 12, scale: 2 }).notNull(),
  retailPrice: numeric("retail_price", { precision: 12, scale: 2 }).notNull(),
  accessoryCost: numeric("accessory_cost", { precision: 10, scale: 2 }).notNull(),
  stoneCost: numeric("stone_cost", { precision: 10, scale: 2 }).notNull(),
  platingCost: numeric("plating_cost", { precision: 10, scale: 2 }).notNull(),
  moldCost: numeric("mold_cost", { precision: 10, scale: 2 }).notNull(),
  commission: numeric("commission", { precision: 10, scale: 2 }).notNull(),
  supplierCode: varchar("supplier_code", { length: 100 }).notNull(),
  orderChannel: varchar("order_channel", { length: 20 }),
  shape: varchar("shape", { length: 50 }),
  specialMaterialLoss: numeric("special_material_loss", { precision: 5, scale: 2 }),
  specialMaterialCost: numeric("special_material_cost", { precision: 5, scale: 2 }),
  specialProfitMargin: numeric("special_profit_margin", { precision: 5, scale: 2 }),
  specialLaborFactorRetail: numeric("special_labor_factor_retail", { precision: 5, scale: 2 }),
  specialLaborFactorWholesale: numeric("special_labor_factor_wholesale", { precision: 5, scale: 2 }),
  laborCostDate: timestamp("labor_cost_date", { withTimezone: true }).notNull(),
  accessoryCostDate: timestamp("accessory_cost_date", { withTimezone: true }).notNull(),
  stoneCostDate: timestamp("stone_cost_date", { withTimezone: true }).notNull(),
  platingCostDate: timestamp("plating_cost_date", { withTimezone: true }).notNull(),
  moldCostDate: timestamp("mold_cost_date", { withTimezone: true }).notNull(),
  commissionDate: timestamp("commission_date", { withTimezone: true }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => ({
  userIdIdx: index("price_history_user_id_idx").on(table.userId),
  productIdIdx: index("price_history_product_id_idx").on(table.productId),
}));

// 应用配置表（存储金价、系数等全局配置）
export const appConfig = pgTable("app_config", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  configKey: varchar("config_key", { length: 100 }).notNull(),
  configValue: jsonb("config_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  userIdKeyIdx: index("app_config_user_id_key_idx").on(table.userId, table.configKey),
}));

// ============================================
// Zod 验证 Schema
// ============================================

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Users
export const insertUserSchema = createCoercedInsertSchema(users).pick({
  email: true,
  name: true,
  password: true,
});

export const updateUserSchema = createCoercedInsertSchema(users)
  .pick({
    email: true,
    name: true,
    isActive: true,
  })
  .partial();

// Products
export const insertProductSchema = createCoercedInsertSchema(products).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// 允许指定 id 的产品插入 schema（用于同步）
export const insertProductWithIdSchema = createCoercedInsertSchema(products).omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = createCoercedInsertSchema(products)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .partial();

// PriceHistory
export const insertPriceHistorySchema = createCoercedInsertSchema(priceHistory).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// 允许指定 id 的价格历史插入 schema（用于同步）
export const insertPriceHistoryWithIdSchema = createCoercedInsertSchema(priceHistory).omit({
  userId: true,
  createdAt: true,
});

// AppConfig
export const insertAppConfigSchema = createCoercedInsertSchema(appConfig).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAppConfigSchema = createCoercedInsertSchema(appConfig)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
  })
  .partial();

// ============================================
// TypeScript 类型
// ============================================
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;

export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type UpdateAppConfig = z.infer<typeof updateAppConfigSchema>;

// 价格系数类型
export interface PriceCoefficients {
  // 工费系数模式
  laborFactorMode: "fixed" | "special";
  fixedLaborFactorRetail: number;  // 固定零售价工费系数
  fixedLaborFactorWholesale: number;  // 固定批发价工费系数
  // 材料损耗系数
  materialLoss: number;  // 材料损耗系数（如 1.12）
  // 材料浮动系数
  materialCost: number;  // 材料浮动系数（如 1.00）
  // 关税系数
  profitMargin: number;  // 关税系数（如 1.35）
}




