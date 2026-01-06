import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { sessionManager, userManager } from '../storage/database';
import type { User, Session } from '../storage/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const SESSION_DURATION_DAYS = 30; // 会话有效期为30天

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成 JWT Token
 */
export async function generateToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(JWT_SECRET);
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string };
  } catch (error) {
    return null;
  }
}

/**
 * 用户登录
 */
export async function login(email: string, password: string): Promise<{
  user: User;
  token: string;
} | null> {
  const user = await userManager.getUserByEmail(email);
  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // 生成 Token
  const token = await generateToken(user.id);

  // 创建会话记录
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await sessionManager.createSession({
    userId: user.id,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  return { user, token };
}

/**
 * 用户注册
 */
export async function register(email: string, name: string, password: string): Promise<{
  user: User;
  token: string;
}> {
  // 检查邮箱是否已存在
  const existingUser = await userManager.getUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // 哈希密码
  const hashedPassword = await hashPassword(password);

  // 创建用户
  const user = await userManager.createUser({
    email,
    name,
    password: hashedPassword,
  });

  // 生成 Token
  const token = await generateToken(user.id);

  // 创建会话记录
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await sessionManager.createSession({
    userId: user.id,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  return { user, token };
}

/**
 * 用户登出
 */
export async function logout(token: string): Promise<void> {
  await sessionManager.deleteSession(token);
}

/**
 * 获取当前用户（从 Token）
 */
export async function getCurrentUser(token: string): Promise<User | null> {
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const session = await sessionManager.getSessionByToken(token);
  if (!session) {
    return null;
  }

  const user = await userManager.getUserById(session.userId);
  return user;
}

/**
 * 验证请求是否已认证
 */
export async function isAuthenticated(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return getCurrentUser(token);
}
