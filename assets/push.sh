#!/bin/bash
cd /workspace/projects

echo "正在推送代码到 GitHub..."
echo ""
echo "如果提示输入密码，请输入你的 Personal Access Token"
echo "（不是 GitHub 登录密码）"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "现在去 Vercel 部署："
    echo "1. 访问 https://vercel.com"
    echo "2. 使用 GitHub 登录"
    echo "3. 导入仓库：SilviaFindings/k-gold-quote-system"
    echo "4. 点击 Deploy"
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "1. Personal Access Token 是否正确"
    echo "2. Token 是否有 repo 权限"
    echo "3. 仓库地址是否正确"
fi
