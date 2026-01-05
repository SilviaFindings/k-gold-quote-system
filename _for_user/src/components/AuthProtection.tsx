"use client";

interface AuthProtectionProps {
  children: React.ReactNode;
}

export function AuthProtection({ children }: AuthProtectionProps) {
  // 简化版本：直接返回子组件，不需要认证
  // 如果后续需要认证功能，可以实现完整的登录逻辑
  return <>{children}</>;
}
