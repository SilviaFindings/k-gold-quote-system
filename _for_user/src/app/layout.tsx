import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K金报价系统",
  description: "珠宝行业智能报价管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
