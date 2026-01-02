# K金产品报价表 - 项目导出指南

## 📦 需要下载的文件清单

要完整运行这个项目，你需要下载以下文件和目录：

### 核心文件（必须）

```
📁 项目根目录/
├── 📄 package.json           # 项目依赖配置
├── 📄 tsconfig.json          # TypeScript配置
├── 📄 next.config.ts         # Next.js配置
├── 📄 tailwind.config.ts     # Tailwind CSS配置
├── 📄 .eslintrc.json         # ESLint配置
├── 📄 README.md              # 项目说明
├── 📄 LOCAL_SETUP.md         # 详细部署指南
│
├── 📁 src/                   # 源代码目录
│   └── 📁 app/
│       ├── 📁 quote/
│       │   └── 📄 page.tsx  # 主应用页面（报价计算）
│       ├── 📄 layout.tsx    # 全局布局
│       ├── 📄 page.tsx      # 首页
│       └── 📄 globals.css   # 全局样式
│
├── 📁 public/                # 静态资源目录
│   └── 📄 静态文件（可选）
│
├── 📁 .coze/                 # 环境配置（可选，本地运行不需要）
└── 📁 .cozeproj/             # 项目脚本（可选，本地运行不需要）
```

## 🚀 导出方法

### 方法一：手动复制（推荐）

1. **创建本地文件夹**
   ```
   mkdir k-gold-pricing-system
   cd k-gold-pricing-system
   ```

2. **复制以下文件到本地文件夹**
   - `package.json`
   - `tsconfig.json`
   - `next.config.ts`
   - `tailwind.config.ts`
   - `.eslintrc.json`
   - `README.md`
   - `LOCAL_SETUP.md`

3. **复制 src 目录**
   ```bash
   mkdir src
   mkdir src/app
   # 复制 src/app/ 目录下所有文件
   ```

4. **复制 public 目录**（如果有文件）

### 方法二：使用 Git（如果可用）

如果你有 Git 访问权限：

```bash
git clone <项目仓库地址>
cd k-gold-pricing-system
```

### 方法三：压缩包下载

1. 下载项目压缩包（如 .zip 或 .tar.gz）
2. 解压到本地目录

## 🔧 本地运行步骤

### 1. 安装 Node.js

访问 https://nodejs.org/ 下载并安装 Node.js 18 或更高版本。

### 2. 安装 pnpm（推荐）

```bash
npm install -g pnpm
```

### 3. 安装项目依赖

```bash
cd <你的项目目录>
pnpm install
```

### 4. 启动开发服务器

```bash
pnpm dev
```

### 5. 访问应用

打开浏览器访问：http://localhost:5000

## 📝 配置说明

### package.json
项目的依赖和脚本配置，无需修改。

### tsconfig.json
TypeScript 编译配置，无需修改。

### tailwind.config.ts
Tailwind CSS 配置，无需修改。

### next.config.ts
Next.js 配置，无需修改。

## ⚠️ 注意事项

1. **不需要的文件**
   - `.coze/` 和 `.cozeproj/` 目录是云平台特有的，本地运行不需要

2. **数据持久化**
   - 数据保存在浏览器 localStorage 中
   - 不同浏览器数据不共享
   - 清除浏览器数据会丢失所有数据

3. **首次运行**
   - 首次运行时所有数据为空
   - 可以通过 Excel 批量导入数据
   - 或使用手动录入添加产品

## 🎯 快速测试

安装完成后，你可以：

1. 访问 http://localhost:5000
2. 尝试添加一个测试产品：
   - 货号：TEST001
   - 名称：测试产品
   - 重量：5
   - 人工成本：10
   - 金种：18K

3. 查看自动计算的价格

## 🆘 常见问题

### Q: 安装依赖时报错
A: 检查 Node.js 版本是否 >= 18，或尝试使用 `npm install` 代替 `pnpm install`

### Q: 启动后访问 localhost:5000 显示无法连接
A: 检查端口 5000 是否被其他程序占用，或修改 `package.json` 中的端口配置

### Q: Excel 导入失败
A: 确保 Excel 文件格式正确，包含货号和名称列

### Q: 修改代码后页面不更新
A: Next.js 支持热更新，保存文件后页面应该自动刷新，如未生效尝试重启开发服务器

## 📞 支持

如有问题，请查看 `LOCAL_SETUP.md` 获取更详细的说明。
