import { NextRequest } from "next/server";

/**
 * 获取当前会话信息
 * 从请求的 Authorization header 中提取 token 并验证
 */
export async function getSession(req?: NextRequest) {
  // 如果没有传入 request 对象，尝试从全局或上下文中获取
  const request = req || (global as any).request;

  if (!request) {
    return null;
  }

  // 从 Authorization header 中获取 token
  const authHeader = request.headers?.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // 验证 token
  const { verifyToken, getCurrentUser } = await import('@/lib/auth');
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // 获取用户信息
  const user = await getCurrentUser(token);
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}
