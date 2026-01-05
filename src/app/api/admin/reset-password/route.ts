import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getDb } from 'coze-coding-dev-sdk';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/reset-password - 重置用户密码（仅用于开发/调试）
 *
 * 请求体：
 * {
 *   "email": "user@example.com"
 * }
 *
 * 返回：
 * {
 *   "success": true,
 *   "message": "密码已重置为 admin123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 查找用户
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 重置密码为 admin123
    const newPassword = 'admin123';
    const hashedPassword = await hashPassword(newPassword);

    // 直接更新密码（绕过 schema 验证，因为这是管理操作）
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: `密码已重置为: ${newPassword}`,
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/reset-password - 列出所有用户
 */
export async function GET() {
  try {
    const db = await getDb();
    const allUsers = await db.select().from(users);

    // 不返回密码
    const safeUsers = allUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({
      users: safeUsers,
    });
  } catch (error: any) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
