"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setCopied(false);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "发送重置邮件失败");
      }

      setMessage("重置密码邮件已发送到您的邮箱，请查收。");

      // 如果是开发环境，显示重置链接
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 如果 clipboard API 不可用，使用传统方法
      const textArea = document.createElement("textarea");
      textArea.value = resetUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            忘记密码
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            输入您的邮箱地址，我们将发送重置密码的链接
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

          {resetUrl && (
            <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-blue-800 mb-3 font-medium">
                ⚙️ 开发环境：重置密码链接
              </p>
              <p className="text-sm text-blue-700 mb-3">
                当前未配置邮件服务，请选择以下方式继续：
              </p>

              <div className="space-y-3">
                <a
                  href={resetUrl}
                  className="block w-full text-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  suppressHydrationWarning
                >
                  点击跳转到重置密码页面
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex-1 py-2 px-4 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    suppressHydrationWarning
                  >
                    {copied ? "已复制！" : "复制链接"}
                  </button>
                </div>

                <details className="mt-3">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 select-none">
                    查看完整链接 ▼
                  </summary>
                  <div className="mt-2">
                    <p className="text-xs text-blue-600 break-all font-mono bg-white p-3 rounded border border-blue-200">
                      {resetUrl}
                    </p>
                  </div>
                </details>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">
              邮箱地址
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-black focus:border-blue-500 focus:outline-none sm:text-sm"
              placeholder="邮箱地址"
              suppressHydrationWarning
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              suppressHydrationWarning
            >
              {loading ? "发送中..." : "发送重置邮件"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-indigo-600 hover:text-indigo-500"
              suppressHydrationWarning
            >
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
