import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "K金产品报价计算表",
  description: "K金产品报价计算表系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${notoSansSC.variable} font-sans antialiased`}
        style={{ fontFamily: '"Inter", "Noto Sans SC", "Segoe UI", "Microsoft YaHei", sans-serif' }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
