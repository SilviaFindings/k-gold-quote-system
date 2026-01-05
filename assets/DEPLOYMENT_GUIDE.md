# 珠宝报价系统部署指南

## 部署到 Vercel（推荐，完全免费）

### 为什么选择 Vercel？
- ✅ 完全免费（个人使用）
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动部署（代码更新自动上线）
- ✅ 支持自定义域名
- ✅ 稳定可靠

---

## 部署步骤

### 第一步：创建 GitHub 仓库

1. **访问 GitHub**：https://github.com
2. **登录/注册账户**
3. **创建新仓库**：
   - 点击右上角 "+" → "New repository"
   - 仓库名称：`k-gold-quote-system`
   - 描述：珠宝报价单管理系统
   - 选择 "Public"（公开）或 "Private"（私有）
   - 不要勾选 "Initialize with README"
   - 点击 "Create repository"

---

### 第二步：推送到 GitHub

#### 在扣子 IDE 终端中执行以下命令：

```bash
# 进入项目目录
cd /workspace/projects

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/k-gold-quote-system.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

**如果推送失败，可能需要身份验证：**

```bash
# 方式1：使用 Personal Access Token（推荐）
# 1. 访问 GitHub 设置 → Developer settings → Personal access tokens → Tokens (classic)
# 2. 创建新 token，勾选 "repo" 权限
# 3. 复制 token
# 4. 执行推送时输入用户名和 token（token 作为密码）

# 方式2：使用 SSH
# 需要先配置 SSH 密钥
```

---

### 第三步：部署到 Vercel

#### 1. 注册 Vercel

访问：https://vercel.com
- 使用 GitHub 账号登录（推荐）
- 或使用邮箱注册

#### 2. 导入项目

- 登录后点击 "Add New..." → "Project"
- Vercel 会自动显示你的 GitHub 仓库
- 找到 `k-gold-quote-system` 并点击 "Import"

#### 3. 配置项目

Vercel 会自动检测到 Next.js 项目，基本配置如下：

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

点击 "Deploy" 开始部署。

---

### 第四步：等待部署完成

- 部署时间：2-5 分钟
- 部署成功后会显示一个 URL，例如：
  ```
  https://k-gold-quote-system.vercel.app
  ```

---

### 第五步：配置自定义域名（可选）

#### 1. 在 Vercel 中添加域名

1. 进入项目页面
2. 点击 "Settings" → "Domains"
3. 输入你的域名，例如：`quote.yourdomain.com`
4. 点击 "Add"

#### 2. 配置 DNS

根据 Vercel 提供的说明，在你的域名提供商处添加 DNS 记录：

```
类型: CNAME
名称: quote（或 @）
值: cname.vercel-dns.com
```

---

### 第六步：验证部署

访问你的 Vercel URL，确认：
- ✅ 页面能正常访问
- ✅ 功能正常使用
- ✅ 数据可以保存

---

## 后续维护

### 自动部署

每次推送到 GitHub，Vercel 会自动重新部署：

```bash
# 修改代码后
git add .
git commit -m "描述你的修改"
git push
```

### 查看部署日志

1. 进入 Vercel 项目页面
2. 点击 "Deployments"
3. 点击具体的部署记录查看日志

### 回滚版本

如果新版本有问题，可以快速回滚：

1. 进入 Vercel 项目页面
2. 点击 "Deployments"
3. 找到之前的稳定版本
4. 点击右侧的 "..." → "Promote to Production"

---

## 数据备份（重要）

### LocalStorage 数据

由于数据存储在浏览器 LocalStorage 中，部署后仍然需要：

1. **定期导出 Excel**
   - 在应用中点击"导出"按钮
   - 选择"全部产品"范围
   - 保存到本地

2. **浏览器数据备份**
   - 使用固定的浏览器
   - 不要清除缓存
   - 可以使用浏览器的导出功能

### 如果需要多用户/多设备使用

当前版本使用 LocalStorage，适合单用户。如果需要多人协作，建议：

1. 添加后端 API
2. 使用数据库（PostgreSQL/MySQL）
3. 实现用户登录和权限管理

这需要额外开发，可以作为后续功能。

---

## 常见问题

### Q1: 部署后访问速度慢？
A: Vercel 使用全球 CDN，速度通常很快。如果慢，检查网络或更换地区。

### Q2: 部署失败怎么办？
A: 查看 Vercel 部署日志，常见原因：
- 构建命令错误
- 依赖包问题
- 环境变量缺失

### Q3: 如何更新项目？
A:
```bash
git add .
git commit -m "更新描述"
git push
```
Vercel 会自动部署。

### Q4: 免费额度够用吗？
A: 个人使用完全够用。免费额度：
- 100GB 带宽/月
- 无限部署
- 无限项目

### Q5: 数据会丢失吗？
A: 代码不会丢失，但数据（产品、设置）存储在浏览器中：
- 定期导出 Excel 备份
- 使用固定浏览器
- 不要清除缓存

---

## 其他部署选项

### Netlify（也免费）

类似 Vercel，部署流程类似：
1. 注册 Netlify
2. 连接 GitHub 仓库
3. 自动部署

### 自建服务器

如果有自己的服务器：
1. 准备一台云服务器（阿里云、腾讯云等）
2. 安装 Node.js 和 npm
3. 克隆代码：`git clone https://github.com/YOUR_USERNAME/k-gold-quote-system.git`
4. 安装依赖：`npm install`
5. 构建：`npm run build`
6. 运行：`npm start`
7. 配置 Nginx 反向代理
8. 使用 PM2 管理进程（持续运行）

---

## 联系支持

如有问题，可以：
1. 查看 Vercel 文档：https://vercel.com/docs
2. 查看 Next.js 文档：https://nextjs.org/docs
3. 搜索 Stack Overflow

---

**祝你部署成功！**
