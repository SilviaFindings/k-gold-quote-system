import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

/**
 * GET /api/auth/me - 获取当前用户信息
 */
export async function GET(request: NextRequest) {
  try {
    const user = await isAuthenticated(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
