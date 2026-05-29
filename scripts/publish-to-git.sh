#!/usr/bin/env bash
# 将 react-workspace 发布到独立的 GitHub 仓库
#
# 用法:
#   ./scripts/publish-to-git.sh https://github.com/YOUR_USERNAME/react-workspace.git
#   ./scripts/publish-to-git.sh https://github.com/YOUR_USERNAME/react-workspace.git --yes
#
# 步骤:
#   1. 本地 build 验证
#   2. 克隆远程仓库（或初始化新仓库）
#   3. 同步源码并提交
#   4. push 到 GitHub

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

VERSION=$(node -p "require('./package.json').version")

echo ">>> [2/4] 准备临时目录..."
TEMP_DIR=$(mktemp -d)

REMOTE_EXISTS=false
if git ls-remote "$REMOTE_URL" HEAD >/dev/null 2>&1; then
  REMOTE_HEAD=$(git ls-remote "$REMOTE_URL" HEAD | awk '{print $1}')
  if [ -n "$REMOTE_HEAD" ]; then
    REMOTE_EXISTS=true
  fi
fi

if [ "$REMOTE_EXISTS" = true ]; then
  echo "    远程仓库已有历史，克隆后增量更新..."
  git clone --depth 1 "$REMOTE_URL" "$TEMP_DIR"
else
  echo "    远程仓库为空，初始化新仓库..."
  mkdir -p "$TEMP_DIR"
  cd "$TEMP_DIR"
  git init
  git branch -M main
  git remote add origin "$REMOTE_URL"
fi

echo ">>> [3/4] 同步文件..."
rsync -a \
  --exclude node_modules \
  --exclude .git \
  --exclude dist-demo \
  "$PACKAGE_DIR/" "$TEMP_DIR/"

cd "$TEMP_DIR"

cat > .gitattributes << 'EOF'
*.sh text eol=lf
EOF

git add -A

if git diff --staged --quiet; then
  echo "    无文件变更，跳过提交"
else
  git commit -m "$(cat <<EOF
release: react-workspace v${VERSION}

IDE-style multi-window workspace for React.
EOF
)"
fi

echo ""
echo ">>> [4/4] 推送到 GitHub"
echo "    远程: $REMOTE_URL"
echo "    版本: v${VERSION}"
echo ""

PUSH_CMD="git push -u origin main"

if [ "$AUTO_YES" = "--yes" ]; then
  $PUSH_CMD
else
  read -p "确认推送? (y/N) " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消。临时目录: $TEMP_DIR"
    exit 0
  fi
  $PUSH_CMD
fi

echo ""
echo "✅ 发布成功!"
echo ""
echo "下一步:"
echo "  1. 打开 ${REMOTE_URL%.git} 确认代码已上传"
echo "  2. GitHub Actions 会自动 CI + 部署 Demo"
echo "  3. Demo: https://$(echo "$REMOTE_URL" | sed -E 's#.*github.com[:/]([^/]+)/([^/.]+).*#\1.github.io/\2/#')"
