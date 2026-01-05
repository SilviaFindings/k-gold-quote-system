# 紧急部署指南

## ⚠️ 重要：关闭电脑前的必做事项

### 当前风险
- 扣子 IDE 会话结束后，`/workspace/projects` 临时工作区**可能被清理**
- 虽然有打包备份，但不如直接部署方便

---

## 🚀 立即部署（5分钟完成）

### 第一步：创建 GitHub 仓库（2分钟）

1. **访问 GitHub**：https://github.com
2. **登录/注册**
3. **点击右上角 "+" → "New repository"**
4. **填写信息**：
   - Repository name: `k-gold-quote-system`
   - Description: `珠宝报价单管理系统`
   - 选择 "Public" 或 "Private"
   - ❌ 不要勾选 "Add a README file"
   - ❌ 不要勾选其他选项
5. **点击 "Create repository"**

---

### 第二步：推送代码到 GitHub（1分钟）

在扣子 IDE 终端执行以下命令：

```bash
cd /workspace/projects

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/k-gold-quote-system.git

# 推送代码
git branch -M main
git push -u origin main
```

**如果需要身份验证**：
- 用户名：GitHub 用户名
- 密码：**不是登录密码，是 Personal Access Token**
  - 访问：https://github.com/settings/tokens
  - 点击 "Generate new token" → "Generate new token (classic)"
  - Note: `k-gold-quote-system`
  - Expiration: `No expiration` 或选择有效期
  - 勾选 `repo`（所有权限）
  - 点击 "Generate token"
  - **复制 token（只显示一次）**
  - 推送时输入 token 作为密码

---

### 第三步：部署到 Vercel（2分钟）

1. **访问 Vercel**：https://vercel.com
2. **使用 GitHub 账号登录**
3. **点击 "Add New..." → "Project"**
4. **找到你的仓库** `k-gold-quote-system`
5. **点击 "Import"**
6. **点击 "Deploy"**（使用默认配置）
7. **等待 2-5 分钟**

---

## ✅ 部署完成后

### 你将获得

**永久访问地址**，例如：
```
https://k-gold-quote-system.vercel.app
```

### 关闭电脑后的情况

| 内容 | 状态 |
|------|------|
| **网站** | ✅ 永久在线（24/7） |
| **代码** | ✅ 保存在 GitHub |
| **数据** | ✅ 保存在浏览器 LocalStorage |
| **扣子 IDE** | ❌ 会话结束，但不再需要 |

---

## 🎯 之后的使用方式

### 1. 访问网站
```
直接访问你的 Vercel URL
```

### 2. 修改功能
```bash
# 方式1：在 GitHub 在线编辑
# 访问仓库 → 点击文件 → 编辑 → 提交

# 方式2：在本地开发
git clone https://github.com/YOUR_USERNAME/k-gold-quote-system.git
# 修改后推送，Vercel 自动部署
```

### 3. 数据备份
- 定期导出 Excel（每周一次）
- 使用固定浏览器访问

---

## 🆘 如果遇到问题

### 问题1：推送失败
**原因**：GitHub 需要身份验证
**解决**：使用 Personal Access Token

### 问题2：Vercel 导入失败
**原因**：仓库为空或权限不足
**解决**：确保代码已推送到 GitHub

### 问题3：部署失败
**原因**：构建错误
**解决**：查看 Vercel 部署日志

---

## 📦 备份方案（如果来不及部署）

### 方案1：下载打包文件
```
位置：/workspace/quote_system_20250103.tar.gz
大小：167M
```

### 方案2：直接导出 Excel
1. 在应用中点击"导出"
2. 选择"全部产品"
3. 保存到本地

---

## 🏁 总结

**关闭电脑前，必须完成**：
1. ✅ 创建 GitHub 仓库
2. ✅ 推送代码到 GitHub
3. ✅ 在 Vercel 部署

**完成后**：
- ✅ 网站永久在线
- ✅ 代码永久保存
- ✅ 随时可以访问和修改

**如果不部署**：
- ⚠️ 扣子 IDE 会话结束后可能无法继续
- ⚠️ 需要重新设置环境

---

## ⏰ 时间估算

| 步骤 | 时间 |
|------|------|
| 创建 GitHub 仓库 | 2 分钟 |
| 推送代码 | 1 分钟 |
| Vercel 部署 | 2-5 分钟 |
| **总计** | **5-8 分钟** |

---

**立即行动！5分钟后，你的网站将永久在线！**
