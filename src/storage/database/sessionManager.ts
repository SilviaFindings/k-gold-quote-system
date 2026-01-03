import { eq, and, SQL, sql, gt } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { sessions } from "./shared/schema";
import type { Session, InsertSession } from "./shared/schema";

export class SessionManager {
  async createSession(data: InsertSession): Promise<Session> {
    const db = await getDb();
    const [session] = await db.insert(sessions).values(data).returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    const db = await getDb();
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.token, token),
        sql`${sessions.expiresAt} > NOW()`
      ));
    return session || null;
  }

  async getSessionsByUserId(userId: string): Promise<Session[]> {
    const db = await getDb();
    return db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(sessions.createdAt);
  }

  async deleteSession(token: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(sessions).where(eq(sessions.token, token));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllUserSessions(userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(sessions).where(eq(sessions.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteExpiredSessions(): Promise<number> {
    const db = await getDb();
    const result = await db
      .delete(sessions)
      .where(sql`${sessions.expiresAt} <= NOW()`);
    return result.rowCount ?? 0;
  }
}

export const sessionManager = new SessionManager();
