import { eq, and, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { passwordResetTokens, users } from "./shared/schema";
import * as bcrypt from "bcrypt";

export class PasswordResetManager {
  /**
   * 生成随机 token
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 创建密码重置 token（1小时过期）
   */
  async createResetToken(email: string): Promise<{ token: string; resetUrl: string } | null> {
    const db = await getDb();

    // 查找用户
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      // 即使用户不存在，也返回成功（避免邮箱枚举攻击）
      return null;
    }

    // 生成 token
    const token = this.generateToken();

    // 设置过期时间为1小时后
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 保存 token
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
    });

    // 生成重置链接（对 token 进行 URL 编码）
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/reset-password?token=${encodeURIComponent(token)}`;

    return { token, resetUrl };
  }

  /**
   * 验证 token 并返回用户 ID
   */
  async validateToken(token: string): Promise<{ userId: string; email: string } | null> {
    const db = await getDb();

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    if (!resetToken) {
      return null;
    }

    // 检查是否已使用
    if (resetToken.used) {
      return null;
    }

    // 检查是否过期
    if (new Date(resetToken.expiresAt) < new Date()) {
      return null;
    }

    // 获取用户信息
    const [user] = await db.select().from(users).where(eq(users.id, resetToken.userId));

    if (!user) {
      return null;
    }

    return { userId: user.id, email: user.email };
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const db = await getDb();

    // 验证 token
    const validation = await this.validateToken(token);

    if (!validation) {
      return false;
    }

    const { userId } = validation;

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId));

    // 标记 token 为已使用
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));

    return true;
  }

  /**
   * 清理过期的 token
   */
  async cleanupExpiredTokens(): Promise<void> {
    const db = await getDb();
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < ${new Date().toISOString()}`);
  }
}

export const passwordResetManager = new PasswordResetManager();
