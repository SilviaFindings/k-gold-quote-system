# Vercel 部署指南

## 前置条件
- 已有 GitHub 仓库：https://github.com/SilviaFindings/k-gold-quote-system

## 部署步骤

### 1. 登录 Vercel
访问 https://vercel.com/signup 并使用GitHub账号登录

### 2. 导入项目
1. 点击 "Add New..." → "Project"
2. 在 "Import Git Repository" 中找到 `k-gold-quote-system`
3. 点击 "Import"

### 3. 配置环境变量
在部署配置页面添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL数据库连接字符串 | `postgresql://user:pass@host:5432/dbname` |

**注意**：Vercel需要配置PostgreSQL数据库，可以使用：
- Vercel Postgres（推荐）
- Supabase
- Neon
- 或其他PostgreSQL服务

### 4. 部署
1. 点击 "Deploy" 按钮
2. 等待约2-3分钟
3. 部署完成后，Vercel会提供一个 `.vercel.app` 域名

### 5. 自定义域名（可选）
1. 在Vercel项目设置中添加自定义域名
2. 配置DNS记录

## 数据库配置说明

### 使用 Vercel Postgres

1. 在Vercel项目中点击 "Storage" 标签
2. 创建 Vercel Postgres 数据库
3. 系统会自动添加 `POSTGRES_URL` 等环境变量
4. 在代码中使用 `DATABASE_URL` 即可

### 使用其他PostgreSQL服务

确保数据库连接字符串格式为：
```
postgresql://用户名:密码@主机:端口/数据库名
```

## 部署后测试

1. 访问部署后的URL
2. 注册/登录账户
3. 测试核心功能：
   - 添加产品
   - 计算价格
   - 导出Excel
