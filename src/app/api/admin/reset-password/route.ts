import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { userManager } from '@/storage/database';

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

    // 查找用户
    const user = await userManager.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 重置密码为 admin123
    const newPassword = 'admin123';
    const hashedPassword = await hashPassword(newPassword);

    await userManager.updateUser(user.id, {
      password: hashedPassword,
    });

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
    const users = await userManager.getUsers();

    // 不返回密码
    const safeUsers = users.map(user => ({
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
