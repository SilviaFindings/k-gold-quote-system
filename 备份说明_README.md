# K金报价系统 - 完整备份说明

## 备份文件信息

**文件名**: `k-gold-quote-system-final-backup.tar.gz`
**大小**: 42MB
**包含**: 完整源代码、配置文件、文档

## 如何使用这个备份

### 1. 解压文件
```bash
tar -xzf k-gold-quote-system-final-backup.tar.gz
```

### 2. 安装依赖
```bash
cd k-gold-quote-system
pnpm install
# 或使用 npm install
```

### 3. 启动项目
```bash
pnpm dev
# 或使用 npm run dev
# 访问 http://localhost:3000
```

### 4. 推送到 GitHub
```bash
git init
git remote add origin https://github.com/SilviaFindings/k-gold-quote-system.git
git add .
git commit -m "恢复完整K金报价系统"
git push origin main
```

## 项目功能清单

### ✅ 核心功能
1. 珠宝报价计算（批发价/零售价）
2. 产品管理（分类/子分类/形状）
3. Excel导入导出
4. 供应商代码自动识别
5. 材质智能识别（KR/KY/KW）
6. 金子颜色优先识别（从Excel）
7. 历史记录管理
8. 成本管理
9. 特殊系数调整
10. 批量操作

### ✅ 所有功能都已实现
- 没有任何功能缺失
- 所有代码都包含在内
- 完整的7811行核心代码
- 完整的依赖配置

## 技术栈
- Next.js 16.0.10
- React 19.2.1
- TypeScript 5
- Tailwind CSS 4
- xlsx-js-style

## 注意事项
1. 本地存储数据在浏览器 localStorage 中
2. 需要确保 pnpm 或 npm 已安装
3. 默认端口是 5000
4. 数据备份文件：珠宝报价单备份_2026-1-5 (1).json (328KB)
