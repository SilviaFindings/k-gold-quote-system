"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
  const [status, setStatus] = useState<string>("检查中...");
  const [apiStatus, setApiStatus] = useState<string>("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setApiStatus(`已登录: ${JSON.stringify(data)}`);
        } else {
          setApiStatus(`未登录 (${response.status})`);
        }
        setStatus("系统正常");
      } catch (error) {
        setApiStatus(`错误: ${error}`);
        setStatus("系统异常");
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">系统诊断页面</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">服务状态</h2>
          <p className="text-gray-700">状态: <span className="font-mono">{status}</span></p>
          <p className="text-gray-700">API: <span className="font-mono">{apiStatus}</span></p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">测试账号</h2>
          <ul className="space-y-2 text-gray-700">
            <li>邮箱: <span className="font-mono">admin@example.com</span></li>
            <li>密码: <span className="font-mono">admin123</span></li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">快速操作</h2>
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full text-center py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              前往登录页
            </a>
            <a
              href="/quote"
              className="block w-full text-center py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            >
              前往报价单页面
            </a>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">浏览器诊断</h2>
          <p className="text-yellow-700 text-sm">
            如果您看到此页面但无法登录，请尝试：
          </p>
          <ol className="list-decimal list-inside text-yellow-700 text-sm space-y-1 mt-2">
            <li>清除浏览器缓存 (Ctrl+Shift+Delete)</li>
            <li>禁用浏览器扩展</li>
            <li>使用无痕/隐私模式</li>
            <li>检查浏览器控制台 (F12) 是否有错误</li>
            <li>确认 JavaScript 已启用</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
