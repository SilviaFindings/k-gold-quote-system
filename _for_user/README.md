# K金报价系统

珠宝行业智能报价管理系统

## 功能特性

### 核心功能
- ✅ 珠宝报价计算（批发价/零售价）
- ✅ 产品管理（分类/子分类/形状）
- ✅ Excel导入导出
- ✅ 供应商代码自动识别
- ✅ 材质智能识别（KR/KY/KW）
- ✅ 金子颜色优先识别（从Excel）
- ✅ 历史记录管理
- ✅ 成本管理（6种成本类型）
- ✅ 特殊系数调整（7种系数）
- ✅ 批量操作

### 智能识别
- 前缀识别：E1-KEW001/18K → E1, KEW001/18K
- 后缀识别：KEW001/10KR-J5 → J5, KEW001/10KR
- 末尾识别：KBD250-K2 → K2, KBD250/K14 (默认14K时)
- 横杠替换：KEW001-10KR → KEW001/10KR
- 材质识别：KR(玫瑰金)、KY(黄金)、KW(白金)

## 技术栈

- **框架**: Next.js 16.0.10 (App Router)
- **UI库**: React 19.2.1
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **Excel处理**: xlsx-js-style

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问应用

打开浏览器访问：http://localhost:5000

## 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/
│   ├── quote/
│   │   └── page.tsx       # 主页面（7811行）
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 根页面（重定向）
│   └── globals.css         # 全局样式
└── components/
    └── AuthProtection.tsx  # 认证保护组件
```

## 数据存储

- 产品数据存储在浏览器 localStorage
- 历史记录存储在 localStorage
- 金价设置存储在 localStorage

## Excel导入格式

支持以下列：
- 货号（必需）
- 产品名称（必需）
- 规格
- 重量
- 工费
- 成色
- 金子颜色（支持KR/KY/KW格式）
- 配件成本
- 石头成本
- 电镀成本
- 模具成本
- 佣金
- 供应商代码
- 下单口
- 形状

## 特殊系数

- 特殊材料损耗系数
- 特殊材料浮动系数
- 特殊关税系数
- 特殊零售价工费系数
- 特殊批发价工费系数
- 特殊美金汇率（US201订单）
- 特殊佣金率（默认10%）

## GitHub推送

```bash
# 初始化Git
git init

# 添加远程仓库
git remote add origin https://github.com/SilviaFindings/k-gold-quote-system.git

# 添加所有文件
git add .

# 提交
git commit -m "添加K金报价系统"

# 推送
git push origin main
```

## 注意事项

- 所有数据存储在本地浏览器localStorage中
- 清除浏览器数据会丢失所有数据
- 建议定期使用Excel导出功能备份数据
- 默认端口是5000

## 版本历史

- v1.0.0: 初始版本
  - 完整的报价计算功能
  - Excel导入导出
  - 智能识别功能
  - 历史记录管理
