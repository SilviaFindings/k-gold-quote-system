# 珠宝报价单管理系统

## 项目概述
这是一个基于 Next.js + React + TypeScript + Tailwind CSS 开发的珠宝报价单管理系统，支持 K 金和银制产品的产品管理、价格计算、副号自动生成、云端同步等功能。

## 系统模块

### K 金报价系统（/quote）
主要处理 K 金首饰产品的报价管理。

#### 1. 产品管理
- 三大产品分类：配件、宝石托、链条
- 支持21种子分类
- 产品信息录入：货号、名称、规格、重量、材质等
- 成本管理：工费、配件成本、石头成本、电镀成本、模具成本、佣金
- 供应商代码和下单口管理
- 智能材质识别（从货号自动识别 10K/14K/18K）

#### 2. 价格计算
- 支持批发价和零售价计算
- 金价管理（10K、14K、18K）
- 可调节的价格系数：
  - 材料损耗系数
  - 材料浮动系数
  - 关税系数
  - 零售价工费系数
  - 批发价工费系数
- 汇率设置
- 特殊系数支持（为单个产品设置专属系数）

### 3. 副号自动生成系统

#### DU 系列副号（系数变化）
- 用于特殊系数变化
- 基于基础货号生成
- 生成规则：基础货号 + DU1, DU2, DU3...
- 固定系数模式下修改成本不生成副号
- 特殊系数模式下修改成本生成新副号

#### 字母系列副号（规格变化）
- 用于规格变化
- 基于当前货号生成延伸号
- 生成规则：当前货号 + A, B, C...
- 每次改规格都生成新副号

### 4. 批量操作
- 批量更新供应商代码
- 批量修改下单口
- 批量修改价格系数
- 批量更新金价

### 5. 导入导出
- Excel 导入产品数据
- Excel 导出报价单（支持按分类和范围选择）
- 导入时可配置是否导入重量、工费和默认材质

### 6. 搜索功能
- 多维度搜索：名称、规格、供应商代码、材质、形状
- 搜索范围选择：当前分类/全部分类

---

### 银制品报价系统（/silver-quote）
主要处理银制产品的报价管理，支持云端同步功能。

#### 1. 产品分类
- **配件**：圆珠、镶嵌配件、珍珠配件、扣子等
- **宝石托**：戒子托、耳环托、吊坠托等
- **链条**：金链、延长链等
- **其它**：银板、银线、银花边等

#### 2. 价格计算
- 批发价和零售价计算
- 银价管理
- 价格系数设置（工费、材料损耗、汇率等）

#### 3. 云端同步功能
- **上传数据**：将本地银制品数据保存到云端
- **合并下载**：云端数据与本地数据合并
- **替换下载**：使用云端数据完全替换本地数据
- **清空数据**：同时清空云端和本地数据（需要密码验证）

#### 4. 密码管理
- **设置清空数据密码**：首次设置需要输入登录密码验证身份
- **修改清空数据密码**：修改已设置的密码
- **密码要求**：至少 6 位字符
- **密码用途**：防止误操作清空所有数据

⚠️ **重要**：
- 清空数据会同时删除云端和本地所有银制品数据
- 清空前请确保已导出 Excel 备份
- 此操作不可恢复

#### 5. 导入导出
- Excel 导入产品数据
- Excel 导出报价单
- 支持按分类筛选导出

#### 6. 产品搜索
- 支持按名称、规格、供应商代码搜索
- 支持按当前分类或全部分类搜索

## 技术栈
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **数据存储**: LocalStorage (浏览器本地存储)
- **Excel处理**: xlsx-js-style

## 安装和运行

### 开发环境
```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 5000）
pnpm dev
```

### 生产环境
```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

## 数据存储

### K 金系统数据存储
所有 K 金数据都存储在浏览器的 LocalStorage 中：
- `goldProducts`: 产品数据
- `goldPriceHistory`: 历史记录
- `goldPrice`: 当前金价
- `goldPriceTimestamp`: 金价更新时间
- `priceCoefficients`: 价格系数
- `dataVersion`: 数据版本号

### 银制品系统数据存储
所有银制品数据都存储在浏览器的 LocalStorage 中：
- `silverProducts`: 银制品产品数据
- `silverPriceHistory`: 银制品历史记录
- `silverPrice`: 当前银价
- `silverPriceCoefficients`: 银制品价格系数
- `silverDataVersion`: 银制品数据版本号

⚠️ **注意**：
- 两个系统的数据是独立的，互不影响
- 清空浏览器缓存会丢失所有数据
- 建议定期导出 Excel 备份

## 数据清理

### 清空本地数据
如果需要清空所有本地数据（例如云端数据已清空，需要同步本地数据时），可以按以下步骤操作：

#### 方法一：使用界面按钮（推荐）
1. 点击页面右上角的"☁️ 云端同步"按钮
2. 在弹出的菜单中点击"🗑️ 清空本地数据"按钮（橙色按钮）
3. 确认提示后即可清空所有本地数据

#### 方法二：使用浏览器控制台
1. 按 F12 打开浏览器开发者工具
2. 切换到"Console"（控制台）标签
3. 输入以下命令：
   ```javascript
   localStorage.clear();
   location.reload();
   ```
4. 按回车执行命令

⚠️ **注意**：清空本地数据后不可恢复，建议先导出 Excel 备份！

### 数据重置后
清空本地数据后，系统将恢复到初始状态：
- 产品数量：0 个
- 历史记录：0 条
- 金价和系数：恢复默认值

如果云端有数据，可以通过"📥 合并下载"或"🔄 替换下载"重新从云端同步数据。

## 备份建议

### 1. 定期导出 Excel
建议定期导出所有产品的 Excel 报价单作为备份。

### 2. 浏览器数据备份
由于数据存储在 LocalStorage 中，建议：
- 定期使用浏览器的导出功能备份数据
- 不要清除浏览器缓存

### 3. 项目文件备份
项目已使用 Git 版本控制，所有代码修改都已提交。

## 系统更新日志

### 银制品系统
- 2025-01-07: 添加清空数据密码功能，支持设置和修改密码
- 2025-01-07: 修复清空数据功能，确保同时清空云端和本地数据
- 2025-01-07: 添加密码验证模态框，优化用户提示
- 2025-01-07: 添加银制品报价系统，支持云端同步功能
- 2025-01-07: 实现银制品产品管理和价格计算功能

### K 金系统
- 2025-01-03: 去掉副号破折号，简化货号显示
- 2025-01-03: 实现字母副号生成逻辑
- 2025-01-03: 修正副号生成逻辑
- 2025-01-03: 添加工费系数模式选择
- 2025-01-03: 实现产品副号自动生成功能

## 使用注意事项
1. 系统数据存储在浏览器本地，更换浏览器或清除缓存会丢失数据
2. 建议定期导出 Excel 备份
3. 货号生成规则已实现自动化，手动输入时请注意格式
4. 特殊系数和固定系数的选择会影响副号生成逻辑

## 长期使用建议
1. 定期 Git commit 保存代码修改
2. 导出 Excel 作为数据备份
3. 如需部署到服务器，建议使用 Vercel 或 Netlify
4. 如需多人协作，建议将数据迁移到后端数据库

## Git 推送到 GitHub 指南

### 推送前准备

#### 1. 生成 SSH 密钥

```cmd
ssh-keygen -t ed25519 -C "你的邮箱@example.com"
```

按回车 3 次：
1. 第一次：使用默认文件路径
2. 第二次：不设置密码（留空）
3. 第三次：确认密码（留空）

#### 2. 复制公钥

```cmd
type %USERPROFILE%\.ssh\id_ed25519.pub
```

复制显示的以 `ssh-ed25519` 开头的完整内容。

#### 3. 添加 SSH Key 到 GitHub

1. 访问：https://github.com/settings/keys
2. 点击右上角的 **"New SSH key"**
3. 填写信息：
   - **Title**：随意填写（如：`我的电脑`）
   - **Key type**：选择 **"Authentication Key"**
   - **Key**：粘贴刚才复制的公钥
4. 点击 **"Add SSH key"**

#### 4. 配置远程仓库为 SSH

```cmd
# 进入项目目录
cd 你的项目路径

# 更改远程仓库地址
git remote set-url origin git@github.com:SilviaFindings/k-gold-quote-system.git

# 验证远程仓库
git remote -v
```

应该显示：
```
origin  git@github.com:SilviaFindings/k-gold-quote-system.git (fetch)
origin  git@github.com:SilviaFindings/k-gold-quote-system.git (push)
```

### 推送代码

```cmd
# 添加所有修改
git add .

# 提交更改
git commit -m "提交说明"

# 推送到 GitHub
git push origin main
```

**首次推送时**会提示：
```
The authenticity of host 'github.com (20.205.243.166)' can't be established.
ED25519 key fingerprint is: SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

输入 `yes` 并按回车。

### 常用 Git 命令

```cmd
# 查看当前状态
git status

# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v

# 拉取最新代码
git pull origin main

# 查看文件差异
git diff

# 放弃本地修改（危险！）
git reset --hard HEAD
```

### 推送成功示例

```
Warning: Permanently added 'github.com (ED25519) to the list of known hosts.
Everything up-to-date
```

表示推送成功且已是最新状态。

---

## 联系方式
如有问题或建议，请通过以下方式联系：
- 项目仓库：https://github.com/SilviaFindings/k-gold-quote-system
- 问题反馈：[待添加]

---

**最后更新时间**: 2025年1月7日
**版本**: v1.1.0

---

## 相关文档
- [银制品系统操作指南](./银制品系统操作指南.md)
- [GitHub 上传指南](./GIT_PUSH_GUIDE.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)
