# K金产品报价计算表

一个基于Next.js开发的K金产品报价管理系统，支持产品录入、价格计算、Excel导入导出等功能。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm 或 npm

### 安装依赖
```bash
pnpm install
# 或
npm install
```

### 启动开发服务器
```bash
pnpm dev
# 或
npm run dev
```

### 访问应用
打开浏览器访问: http://localhost:5000

## ✨ 功能特性

- ✅ 产品信息录入和管理
- ✅ 自动价格计算（支持14K和18K金）
- ✅ Excel批量导入/导出
- ✅ 17个产品分类管理
- ✅ 价格历史记录
- ✅ 数据备份和恢复
- ✅ 自定义价格系数
- ✅ 本地数据存储

## 📦 项目结构

```
src/app/quote/page.tsx    # 主应用页面
src/app/layout.tsx        # 页面布局
src/app/page.tsx          # 首页
src/app/globals.css       # 全局样式
```

## ⚠️ 注意事项

- 数据保存在浏览器 localStorage 中，请定期导出备份
- 建议使用现代浏览器（Chrome、Edge、Firefox）
- 清除浏览器数据会导致数据丢失

## 📞 支持

如有问题或建议，请联系开发者。
