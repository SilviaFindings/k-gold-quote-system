import { relations } from "drizzle-orm/relations";
import { users, appConfig, priceHistory, products, sessions } from "./schema";

export const appConfigRelations = relations(appConfig, ({one}) => ({
	user: one(users, {
		fields: [appConfig.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	appConfigs: many(appConfig),
	priceHistories: many(priceHistory),
	products: many(products),
	sessions: many(sessions),
}));

export const priceHistoryRelations = relations(priceHistory, ({one}) => ({
	user: one(users, {
		fields: [priceHistory.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [priceHistory.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	priceHistories: many(priceHistory),
	user: one(users, {
		fields: [products.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));