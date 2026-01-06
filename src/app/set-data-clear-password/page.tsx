"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetDataClearPasswordPage() {
  const router = useRouter();
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    currentPassword: "",
    dataClearPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showClearPassword, setShowClearPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    checkHasPassword();
  }, []);

  const checkHasPassword = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("未登录，请先登录");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/auth/data-clear-password", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("登录已过期，请重新登录");
        setTimeout(() => {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          router.push("/login");
        }, 2000);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "获取状态失败");
      }

      const data = await response.json();
      setHasPassword(data.hasDataClearPassword);
    } catch (err: any) {
      console.error("检查密码状态失败:", err);
      if (err.message.includes("未登录") || err.message.includes("登录已过期")) {
        setError(err.message);
      } else {
        setError("获取状态失败，请稍后重试");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (formData.dataClearPassword !== formData.confirmPassword) {
      setError("两次输入的数据清空密码不一致");
      return;
    }

    if (formData.dataClearPassword.length < 6) {
      setError("数据清空密码长度至少为6位");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("未登录，请先登录");
      }

      const response = await fetch("/api/auth/data-clear-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          dataClearPassword: formData.dataClearPassword,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("登录已过期，请重新登录");
      }

      if (!response.ok) {
        throw new Error(data.error || "设置失败");
      }

      setMessage(hasPassword ? "数据清空密码修改成功" : "数据清空密码设置成功");
      setHasPassword(true);
      setFormData({
        currentPassword: "",
        dataClearPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes("登录已过期") || err.message.includes("未登录")) {
        setTimeout(() => {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          router.push("/login");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {hasPassword ? "修改数据清空密码" : "设置数据清空密码"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {hasPassword
              ? "输入当前密码和新的数据清空密码"
              : "数据清空密码用于确认数据清空操作，与登录密码独立"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="currentPassword" className="sr-only">
                当前登录密码
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                className="rounded relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-black focus:border-blue-500 focus:outline-none sm:text-sm"
                placeholder="当前登录密码"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                suppressHydrationWarning
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="dataClearPassword" className="sr-only">
                数据清空密码
              </label>
              <input
                id="dataClearPassword"
                name="dataClearPassword"
                type={showClearPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.dataClearPassword}
                onChange={(e) =>
                  setFormData({ ...formData, dataClearPassword: e.target.value })
                }
                className="rounded relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-black focus:border-blue-500 focus:outline-none sm:text-sm"
                placeholder={hasPassword ? "新数据清空密码" : "数据清空密码"}
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowClearPassword(!showClearPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                suppressHydrationWarning
              >
                {showClearPassword ? (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                确认数据清空密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="rounded relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-black focus:border-blue-500 focus:outline-none sm:text-sm"
                placeholder="确认数据清空密码"
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                suppressHydrationWarning
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              suppressHydrationWarning
            >
              {loading ? "处理中..." : hasPassword ? "修改密码" : "设置密码"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-indigo-600 hover:text-indigo-500"
              suppressHydrationWarning
            >
              返回
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
