"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthProtectionProps {
  children: React.ReactNode;
}

export function AuthProtection({ children }: AuthProtectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        // 没有 token，跳转到登录页
        router.replace('/login');
        return;
      }

      try {
        // 验证 token 是否有效
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // token 无效，跳转到登录页
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 会自动跳转到登录页
  }

  return <>{children}</>;
}
