#!/usr/bin/env bash
# 将 react-workspace 发布到独立的 GitHub 仓库
#
# 用法:
#   ./scripts/publish-to-git.sh https://github.com/YOUR_USERNAME/react-workspace.git
#   ./scripts/publish-to-git.sh https://github.com/YOUR_USERNAME/react-workspace.git --yes
#
# 步骤:
#   1. 本地 build 验证
#   2. 复制源码到临时目录（不含 node_modules）
#   3. 初始化 git 并 push 到 GitHub

set -euo pipefail

REMOTE_URL="${1:-}"
AUTO_YES="${2:-}"
PACKAGE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$REMOTE_URL" ]; then
  echo "用法: $0 <git-remote-url> [--yes]"
  echo ""
  echo "示例:"
  echo "  $0 https://github.com/liuman/react-workspace.git"
  echo "  $0 git@github.com:liuman/react-workspace.git --yes"
  exit 1
fi

echo ">>> [1/4] 构建包..."
cd "$PACKAGE_DIR"
yarn build
yarn type-check

echo ">>> [2/4] 复制文件到临时目录..."
TEMP_DIR=$(mktemp -d)
rsync -a \
  --exclude node_modules \
  --exclude .git \
  "$PACKAGE_DIR/" "$TEMP_DIR/"

cd "$TEMP_DIR"

echo ">>> [3/4] 初始化 Git 仓库..."
cd "$TEMP_DIR"
yarn install
git init
git branch -M main

cat > .gitattributes << 'EOF'
*.sh text eol=lf
EOF

git add -A
git commit -m "$(cat <<'EOF'
Initial release: react-workspace v1.0.0

IDE-style multi-window workspace component for React.
Features: tabs, floating windows, sidebar, URL sync, localStorage persistence.
EOF
)"

git remote add origin "$REMOTE_URL"

echo ""
echo ">>> [4/4] 推送到 GitHub"
echo "    远程: $REMOTE_URL"
echo ""

if [ "$AUTO_YES" = "--yes" ]; then
  git push -u origin main
else
  read -p "确认推送? (y/N) " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消。临时目录: $TEMP_DIR"
    exit 0
  fi
  git push -u origin main
fi

echo ""
echo "✅ 发布成功!"
echo ""
echo "下一步:"
echo "  1. 打开 ${REMOTE_URL%.git} 确认代码已上传"
echo "  2. 在 GitHub 仓库 Settings → General 填写 Description 和 Topics"
echo "     建议 Topics: react, workspace, multi-window, tabs, ide, antd"
echo "  3. （可选）发布到 npm:"
echo "     cd packages/react-workspace && npm publish --access public"
echo "  4. 更新 package.json 中的 repository / homepage / bugs 为你的 GitHub 地址"
