# Git 推送到 GitHub 操作指南

本文档详细介绍如何将本地代码推送到 GitHub 仓库。

---

## 目录
1. [首次配置](#首次配置)
2. [推送代码](#推送代码)
3. [常用命令](#常用命令)
4. [常见问题](#常见问题)

---

## 首次配置

### 步骤 1：生成 SSH 密钥

在 CMD 或 PowerShell 中执行：

```cmd
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**按回车 3 次**：
1. 第一次：使用默认文件路径 `C:\Users\你的用户名\.ssh\id_ed25519`
2. 第二次：不设置密码（留空）
3. 第三次：确认密码（留空）

**成功提示**：
```
Your identification has been saved in C:\Users\你的用户名\.ssh\id_ed25519
Your public key has been saved in C:\Users\你的用户名\.ssh\id_ed25519.pub
```

---

### 步骤 2：复制公钥

```cmd
type %USERPROFILE%\.ssh\id_ed25519.pub
```

复制显示的完整公钥（以 `ssh-ed25519` 开头）。

**示例**：
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFca4n3hEOMRmFMHORL7c/NSWNdqZIN3uvIpiRXCI0yO your_email@example.com
```

---

### 步骤 3：添加 SSH Key 到 GitHub

1. **访问 GitHub**：https://github.com/settings/keys

2. **添加密钥**：
   - 点击右上角的 **"New SSH key"**
   - **Title**：随意填写（如：`我的电脑-2025-01-05`）
   - **Key type**：选择 **"Authentication Key"**
   - **Key**：粘贴刚才复制的公钥
   - 点击 **"Add SSH key"**

3. **验证密钥**：
   ```cmd
   ssh -T git@github.com
   ```
   成功提示：`Hi SilviaFindings! You've successfully authenticated...`

---

### 步骤 4：配置远程仓库为 SSH

```cmd
# 进入项目目录
cd 你的项目路径

# 查看当前远程仓库
git remote -v

# 更改为 SSH 地址
git remote set-url origin git@github.com:SilviaFindings/k-gold-quote-system.git

# 验证更改
git remote -v
```

**成功提示**：
```
origin  git@github.com:SilviaFindings/k-gold-quote-system.git (fetch)
origin  git@github.com:SilviaFindings/k-gold-quote-system.git (push)
```

---

## 推送代码

### 基本流程

```cmd
# 1. 查看当前状态
git status

# 2. 添加所有修改
git add .

# 3. 提交更改（使用有意义的提交信息）
git commit -m "feat: 添加新功能"

# 4. 推送到 GitHub
git push origin main
```

---

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```cmd
# 新功能
git commit -m "feat: 添加用户登录功能"

# 修复 Bug
git commit -m "fix: 修复价格计算错误"

# 文档更新
git commit -m "docs: 更新 README 说明"

# 重构代码
git commit -m "refactor: 优化数据结构"

# 样式调整
git commit -m "style: 调整页面布局"

# 测试相关
git commit -m "test: 添加单元测试"

# 构建/配置
git commit -m "chore: 更新依赖包版本"
```

---

## 常用命令

### 查看状态

```cmd
# 查看当前工作区状态
git status

# 查看提交历史（简洁版）
git log --oneline

# 查看提交历史（详细信息）
git log --graph --oneline --all
```

---

### 拉取更新

```cmd
# 拉取并合并远程最新代码
git pull origin main

# 拉取但不合并
git fetch origin main

# 查看远程分支更新
git log origin/main..main
```

---

### 撤销操作

```cmd
# 撤销工作区修改（文件还原到上一次提交）
git checkout -- 文件名

# 撤销暂存区修改（取消 git add）
git reset HEAD 文件名

# 撤销最近一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最近一次提交（丢弃修改）
git reset --hard HEAD~1

# ⚠️ 警告：--hard 会永久删除修改，谨慎使用！
```

---

### 分支操作

```cmd
# 查看所有分支
git branch -a

# 创建新分支
git branch 新分支名

# 切换分支
git checkout 分支名

# 创建并切换到新分支
git checkout -b 新分支名

# 删除本地分支
git branch -d 分支名

# 删除远程分支
git push origin --delete 分支名
```

---

## 常见问题

### Q1: 推送时提示 "Connection was reset"

**原因**：网络连接问题或 GitHub 访问限制。

**解决方法**：
1. 检查网络连接
2. 使用 VPN 或代理
3. 切换到 SSH 方式（推荐）

---

### Q2: 提示 "fatal: unable to access ... Recv failure"

**原因**：HTTPS 认证问题或网络限制。

**解决方法**：
```cmd
# 方案 1：切换到 SSH
git remote set-url origin git@github.com:SilviaFindings/k-gold-quote-system.git

# 方案 2：配置代理
git config --global http.proxy http://127.0.0.1:端口号
git config --global https.proxy https://127.0.0.1:端口号

# 方案 3：使用 GitHub Personal Access Token
# 参考：https://docs.github.com/zh/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
```

---

### Q3: 首次推送提示 "authenticity of host can't be established"

**原因**：首次使用 SSH 连接 GitHub。

**解决方法**：
```cmd
The authenticity of host 'github.com (20.205.243.166)' can't be established.
ED25519 key fingerprint is: SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

输入 `yes` 并按回车。

---

### Q4: 提示 "error: failed to push some refs to"

**原因**：远程仓库有本地没有的提交。

**解决方法**：
```cmd
# 方案 1：先拉取再推送
git pull origin main
git push origin main

# 方案 2：强制推送（⚠️ 会覆盖远程，谨慎使用）
git push origin main --force
```

---

### Q5: 提示 "Everything up-to-date"

**原因**：本地代码和远程仓库已经同步，没有新的提交。

**解决方法**：
- 如果这是你期望的结果，说明推送成功！
- 如果想推送修改，请先检查是否有未提交的更改：
  ```cmd
  git status
  ```

---

### Q6: 如何查看远程仓库地址

```cmd
git remote -v
```

输出示例：
```
origin  git@github.com:SilviaFindings/k-gold-quote-system.git (fetch)
origin  git@github.com:SilviaFindings/k-gold-quote-system.git (push)
```

---

### Q7: 如何切换 HTTPS 和 SSH

```cmd
# 切换到 HTTPS
git remote set-url origin https://github.com/SilviaFindings/k-gold-quote-system.git

# 切换到 SSH（推荐）
git remote set-url origin git@github.com:SilviaFindings/k-gold-quote-system.git
```

---

### Q8: SSH 密钥权限问题

**提示**：`Permissions 0644 for 'id_ed25519' are too open.`

**解决方法**：
```cmd
# 修复私钥权限
icacls "%USERPROFILE%\.ssh\id_ed25519" /inheritance:r
icacls "%USERPROFILE%\.ssh\id_ed25519" /grant:r "%USERNAME%:R"
```

---

## 推送流程总结

### 第一次推送

```cmd
# 1. 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 复制公钥并添加到 GitHub
type %USERPROFILE%\.ssh\id_ed25519.pub

# 3. 配置远程仓库
git remote set-url origin git@github.com:SilviaFindings/k-gold-quote-system.git

# 4. 推送代码
git push origin main
```

---

### 日常推送

```cmd
# 1. 查看状态
git status

# 2. 添加修改
git add .

# 3. 提交更改
git commit -m "提交说明"

# 4. 拉取最新代码（避免冲突）
git pull origin main

# 5. 推送到 GitHub
git push origin main
```

---

## 推荐工具

### 图形化工具（可选）

1. **GitHub Desktop**
   - 下载：https://desktop.github.com/
   - 适合初学者，界面友好

2. **VS Code Git 扩展**
   - 内置在 VS Code 中
   - 无需额外安装

3. **Sourcetree**
   - 下载：https://www.sourcetreeapp.com/
   - 功能强大，适合专业用户

---

## 参考资源

- [GitHub 官方文档](https://docs.github.com/zh)
- [Git 官方文档](https://git-scm.com/doc)
- [Pro Git 中文版](https://git-scm.com/book/zh/v2)

---

**最后更新时间**: 2025年1月5日
**版本**: v1.0.0
