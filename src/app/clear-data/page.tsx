"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClearDataPage() {
  const router = useRouter();
  const [step, setStep] = useState<"confirm" | "password">("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dataClearPassword, setDataClearPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = () => {
    setStep("password");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("⚠️ 您当前未登录。请先登录后再清空数据。");
        setLoading(false);
        return;
      }

      // 先验证数据清空密码
      const verifyResponse = await fetch("/api/auth/verify-data-clear-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ dataClearPassword }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.status === 401) {
        throw new Error("登录已过期，请重新登录");
      }

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "验证失败");
      }

      // 验证通过，清空数据
      const clearResponse = await fetch("/api/data/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmed: true }),
      });

      const clearData = await clearResponse.json();

      if (!clearResponse.ok) {
        throw new Error(clearData.error || "清空失败");
      }

      setMessage("数据已成功清空！");

      setTimeout(() => {
        router.push("/quote");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            清空云端数据
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === "confirm"
              ? "此操作将删除云端所有数据，请谨慎操作"
              : "请输入数据清空密码以确认操作"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800 mb-3">{error}</p>
            {error.includes("未登录") && (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-2 w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                suppressHydrationWarning
              >
                去登录
              </button>
            )}
            {(error.includes("未设置数据清空密码") || error.includes("数据清空密码不正确")) && (
              <button
                type="button"
                onClick={() => router.push("/set-data-clear-password")}
                className="mt-2 w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                suppressHydrationWarning
              >
                {error.includes("未设置") ? "设置清空数据密码（本地/云端）" : "重置清空数据密码（本地/云端）"}
              </button>
            )}
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}

        {step === "confirm" && (
          <div className="mt-8 space-y-6">
            <div className="rounded-md bg-yellow-50 p-6 border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ 警告：此操作不可逆
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 将删除所有产品数据</li>
                <li>• 将删除所有价格历史记录</li>
                <li>• 将删除所有应用配置</li>
                <li>• 此操作无法撤销</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                suppressHydrationWarning
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                suppressHydrationWarning
              >
                确认清空
              </button>
            </div>
          </div>
        )}

        {step === "password" && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <label htmlFor="dataClearPassword" className="sr-only">
                数据清空密码
              </label>
              <input
                id="dataClearPassword"
                name="dataClearPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="off"
                required
                value={dataClearPassword}
                onChange={(e) => setDataClearPassword(e.target.value)}
                className="rounded relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-black focus:border-red-500 focus:outline-none sm:text-sm"
                placeholder="数据清空密码"
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("confirm");
                  setDataClearPassword("");
                  setError("");
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                suppressHydrationWarning
              >
                返回
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                suppressHydrationWarning
              >
                {loading ? "清空中..." : "确认清空"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
