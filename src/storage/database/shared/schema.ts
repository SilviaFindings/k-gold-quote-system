import { pgTable, index, unique, varchar, text, boolean, timestamp, foreignKey, jsonb, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"



export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 128 }).notNull(),
	password: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
]);

export const appConfig = pgTable("app_config", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	configKey: varchar("config_key", { length: 100 }).notNull(),
	configValue: jsonb("config_value").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("app_config_user_id_key_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.configKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "app_config_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const priceHistory = pgTable("price_history", {
	id: varchar({ length: 200 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	productId: varchar("product_id", { length: 200 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	subCategory: varchar("sub_category", { length: 100 }).notNull(),
	productCode: varchar("product_code", { length: 100 }).notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	specification: varchar({ length: 500 }).notNull(),
	weight: numeric({ precision: 10, scale: 3 }).notNull(),
	laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).notNull(),
	karat: varchar({ length: 10 }).notNull(),
	goldColor: varchar("gold_color", { length: 20 }).notNull(),
	goldPrice: numeric("gold_price", { precision: 10, scale: 2 }).notNull(),
	wholesalePrice: numeric("wholesale_price", { precision: 12, scale: 2 }).notNull(),
	retailPrice: numeric("retail_price", { precision: 12, scale: 2 }).notNull(),
	accessoryCost: numeric("accessory_cost", { precision: 10, scale: 2 }).notNull(),
	stoneCost: numeric("stone_cost", { precision: 10, scale: 2 }).notNull(),
	platingCost: numeric("plating_cost", { precision: 10, scale: 2 }).notNull(),
	moldCost: numeric("mold_cost", { precision: 10, scale: 2 }).notNull(),
	commission: numeric({ precision: 10, scale: 2 }).notNull(),
	supplierCode: varchar("supplier_code", { length: 100 }).notNull(),
	orderChannel: varchar("order_channel", { length: 20 }),
	shape: varchar({ length: 50 }),
	specialMaterialLoss: numeric("special_material_loss", { precision: 5, scale: 2 }),
	specialMaterialCost: numeric("special_material_cost", { precision: 5, scale: 2 }),
	specialProfitMargin: numeric("special_profit_margin", { precision: 5, scale: 2 }),
	specialLaborFactorRetail: numeric("special_labor_factor_retail", { precision: 5, scale: 2 }),
	specialLaborFactorWholesale: numeric("special_labor_factor_wholesale", { precision: 5, scale: 2 }),
	laborCostDate: timestamp("labor_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	accessoryCostDate: timestamp("accessory_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	stoneCostDate: timestamp("stone_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	platingCostDate: timestamp("plating_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	moldCostDate: timestamp("mold_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	commissionDate: timestamp("commission_date", { withTimezone: true, mode: 'string' }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "price_history_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "price_history_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: varchar({ length: 200 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	subCategory: varchar("sub_category", { length: 100 }).notNull(),
	productCode: varchar("product_code", { length: 100 }).notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	specification: varchar({ length: 500 }).notNull(),
	weight: numeric({ precision: 10, scale: 3 }).notNull(),
	laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).notNull(),
	karat: varchar({ length: 10 }).notNull(),
	goldColor: varchar("gold_color", { length: 20 }).notNull(),
	goldPrice: numeric("gold_price", { precision: 10, scale: 2 }).notNull(),
	wholesalePrice: numeric("wholesale_price", { precision: 12, scale: 2 }).notNull(),
	retailPrice: numeric("retail_price", { precision: 12, scale: 2 }).notNull(),
	accessoryCost: numeric("accessory_cost", { precision: 10, scale: 2 }).notNull(),
	stoneCost: numeric("stone_cost", { precision: 10, scale: 2 }).notNull(),
	platingCost: numeric("plating_cost", { precision: 10, scale: 2 }).notNull(),
	moldCost: numeric("mold_cost", { precision: 10, scale: 2 }).notNull(),
	commission: numeric({ precision: 10, scale: 2 }).notNull(),
	supplierCode: varchar("supplier_code", { length: 100 }).notNull(),
	orderChannel: varchar("order_channel", { length: 20 }),
	shape: varchar({ length: 50 }),
	specialMaterialLoss: numeric("special_material_loss", { precision: 5, scale: 2 }),
	specialMaterialCost: numeric("special_material_cost", { precision: 5, scale: 2 }),
	specialProfitMargin: numeric("special_profit_margin", { precision: 5, scale: 2 }),
	specialLaborFactorRetail: numeric("special_labor_factor_retail", { precision: 5, scale: 2 }),
	specialLaborFactorWholesale: numeric("special_labor_factor_wholesale", { precision: 5, scale: 2 }),
	laborCostDate: timestamp("labor_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	accessoryCostDate: timestamp("accessory_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	stoneCostDate: timestamp("stone_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	platingCostDate: timestamp("plating_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	moldCostDate: timestamp("mold_cost_date", { withTimezone: true, mode: 'string' }).notNull(),
	commissionDate: timestamp("commission_date", { withTimezone: true, mode: 'string' }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "products_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	used: boolean("used").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_unique").on(table.token),
]);

// Type exports
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Product = typeof products.$inferSelect;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type AppConfig = typeof appConfig.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Insert types
export type InsertUser = typeof users.$inferInsert;
export type InsertSession = typeof sessions.$inferInsert;
export type InsertProduct = typeof products.$inferInsert;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;
export type InsertAppConfig = typeof appConfig.$inferInsert;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Update types
export type UpdateUser = Partial<InsertUser>;
export type UpdateSession = Partial<InsertSession>;
export type UpdateProduct = Partial<InsertProduct>;
export type UpdatePriceHistory = Partial<InsertPriceHistory>;
export type UpdateAppConfig = Partial<InsertAppConfig>;
export type UpdatePasswordResetToken = Partial<InsertPasswordResetToken>;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const updateUserSchema = createUpdateSchema(users);
export const insertSessionSchema = createInsertSchema(sessions);
export const updateSessionSchema = createUpdateSchema(sessions);
export const insertProductSchema = createInsertSchema(products);
export const updateProductSchema = createUpdateSchema(products);
export const insertPriceHistorySchema = createInsertSchema(priceHistory);
export const updatePriceHistorySchema = createUpdateSchema(priceHistory);
export const insertAppConfigSchema = createInsertSchema(appConfig);
export const updateAppConfigSchema = createUpdateSchema(appConfig);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export const updatePasswordResetTokenSchema = createUpdateSchema(passwordResetTokens);
