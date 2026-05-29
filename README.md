# react-workspace

一个 React IDE 风格的多窗口工作区组件库，提供类似桌面 IDE 的多窗口管理体验。

## 特性

- **零 UI 框架依赖** — 不依赖 antd，仅 React + CSS
- **多窗口标签页** — 打开、切换、关闭、最小化
- **标签拖拽排序** — 水平拖动标签调整顺序
- **浮动窗口** — 拖出为独立窗口，可调整大小，拖回标签栏还原
- **键盘快捷键** — `Ctrl/Cmd+W` 关闭，`Ctrl/Cmd+Tab` 切换
- **CSS 主题变量** — 支持亮色/暗色主题定制
- **URL 状态同步** — 刷新恢复、分享链接
- **localStorage 持久化** — 浮动窗口位置自动保存
- **在线 Demo** — GitHub Pages 一键体验

## 安装

```bash
yarn add react-workspace
```

### Peer Dependencies

```bash
yarn add react react-dom
# URL 同步（可选）
yarn add react-router-dom
```

## 快速开始

```tsx
import { Workspace } from 'react-workspace';
import 'react-workspace/style.css';
import { useSearchParams } from 'react-router-dom';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
      windowType: 'home',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      windowType: 'settings',
    },
  ];

  return (
    <Workspace
      workspaceId="my-app"
      menuItems={menuItems}
      defaultWindow={{ type: 'home', title: '首页' }}
      syncToUrl
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      sidebarHeader={<div>我的工作区</div>}
      sidebarFooter={<div>用户信息</div>}
      renderWindow={(window, ctx) => {
        switch (window.type) {
          case 'home':
            return <div style={{ padding: 24 }}>欢迎！</div>;
          case 'settings':
            return <div style={{ padding: 24 }}>设置页面</div>;
          default:
            return <div>未知窗口: {window.type}</div>;
        }
      }}
    />
  );
}
```

## API

### `<Workspace />`

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `workspaceId` | `string` | 必填 | 工作区唯一标识，用于 localStorage 隔离 |
| `menuItems` | `SidebarMenuEntry[]` | 必填 | 侧边栏菜单（支持 `{ type: 'divider' }` 分隔线） |
| `renderWindow` | `(window, ctx) => ReactNode` | 必填 | 渲染窗口内容 |
| `defaultWindow` | `{ type, title }` | `{ type: 'home', title: '首页' }` | 默认打开的窗口 |
| `sidebarHeader` | `ReactNode` | - | 侧边栏顶部区域 |
| `sidebarFooter` | `ReactNode` | - | 侧边栏底部区域（固定底部） |
| `loading` | `boolean` | `false` | 加载状态 |
| `syncToUrl` | `boolean` | `false` | 是否同步窗口状态到 URL |
| `preserveUrlParams` | `boolean` | `true` | syncToUrl 时保留 URL 其他参数 |
| `floatingDefaults` | `FloatingWindowDefaults` | - | 浮动窗口默认尺寸 |
| `onWindowsChange` | `(windows, activeId) => void` | - | 窗口列表变化回调 |
| `onReady` | `(api: WorkspaceRef) => void` | - | 工作区就绪回调 |
| `ref` | `WorkspaceRef` | - | 暴露完整工作区 API |
| `siderWidth` | `number` | `240` | 侧边栏宽度 |
| `contentBackground` | `string` | `#f0f2f5` | 内容区背景色 |
| `enableKeyboardShortcuts` | `boolean` | `true` | Ctrl+W / Ctrl+Tab |
| `themeClassName` | `string` | - | 如 `rw-theme-dark` 启用暗色主题 |
| `theme` | `WorkspaceTheme` | - | 通过 props 覆盖 CSS 变量（可与 antd token 映射） |
| `renderSidebar` | `(props) => ReactNode` | - | 自定义侧边栏，例如 Ant Design Menu |

### 与 Ant Design 集成

库核心**零 antd 依赖**，但可无缝配合 Ant Design 使用：

```bash
yarn add react-workspace antd @ant-design/icons
```

#### 1. 主题同步（推荐）

将 antd Design Token 映射为 Workspace CSS 变量，标签栏、边框等会自动与 antd 风格一致：

```tsx
import { ConfigProvider, theme } from 'antd';
import { Workspace, mapAntdTokenToWorkspaceTheme } from 'react-workspace';
import 'react-workspace/style.css';

function ThemedApp() {
  const { token } = theme.useToken();
  return (
    <Workspace
      theme={mapAntdTokenToWorkspaceTheme(token)}
      menuItems={menuItems}
      renderWindow={renderWindow}
      workspaceId="app"
    />
  );
}

export default function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
      <ThemedApp />
    </ConfigProvider>
  );
}
```

也可直接得到 inline style：`mapAntdTokenToCssVars(token)`。

#### 2. 使用 Ant Design 侧边栏

```tsx
import { AntdWorkspaceSidebar } from 'react-workspace/antd';

<Workspace
  renderSidebar={(props) => (
    <AntdWorkspaceSidebar {...props} theme="light" siderWidth={240} />
  )}
  ...
/>
```

`AntdWorkspaceSidebar` 接收与默认侧边栏相同的 props，内部使用 antd `Menu` + `Layout.Sider`。

#### 3. 窗口内容使用 antd 组件

`renderWindow` 渲染的内容完全由你控制，可直接使用 Table、Form、Modal 等任意 antd 组件：

```tsx
renderWindow={(window) => {
  if (window.type === 'users') return <UserTable />;
  return <Empty description="未知页面" />;
}}
```

#### 4. 纯 CSS 定制（不用 antd）

```css
.my-workspace {
  --rw-color-primary: #6366f1;
  --rw-sidebar-width: 260px;
  --rw-tab-height: 36px;
}
```

```tsx
<Workspace className="my-workspace" themeClassName="rw-theme-dark" ... />
```

### 快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl/Cmd + W` | 关闭当前窗口 |
| `Ctrl/Cmd + Tab` | 切换到下一个窗口 |
| `Ctrl/Cmd + Shift + Tab` | 切换到上一个窗口 |

### 主题定制

```css
/* 覆盖 CSS 变量 */
.my-app {
  --rw-color-primary: #6366f1;
  --rw-sidebar-width: 260px;
}
```

```tsx
<Workspace themeClassName="rw-theme-dark" ... />
```

### 本地 Demo

```bash
cd packages/react-workspace
yarn dev:demo    # 开发
yarn build:demo  # 构建
```

### `useWorkspaceContext`

在 `renderWindow` 渲染的内容中访问工作区 API：

```tsx
function MyPage() {
  const { openWindow, closeWindow, windows } = useWorkspaceContext();
  // ...
}
```

### `useWorkspace` Hook

如需更细粒度控制，可直接使用 hook：

```tsx
import { useWorkspace, WindowManager, WorkspaceSidebar } from 'react-workspace';

const workspace = useWorkspace({
  workspaceId: 'my-app',
  defaultWindow: { type: 'home', title: '首页' },
  syncToUrl: true,
  searchParams,
  setSearchParams,
});

const {
  windows,
  activeWindowId,
  openWindow,
  switchWindow,
  closeWindow,
  toggleMinimize,
  floatWindow,
  restoreWindow,
  batchManage,
  updateWindowProps,
  updateWindowTitle,
  clearPendingAction,
  resetWorkspace,
} = workspace;
```

### WindowRenderContext

`renderWindow` 第二个参数提供窗口操作上下文：

```typescript
interface WindowRenderContext {
  workspaceId: string;
  active: boolean;              // 当前窗口是否激活
  activeWindowId: string | null;
  windows: WindowConfig[];
  openWindow: (...) => void;
  switchWindow: (id) => void;
  closeWindow: (id) => void;
  toggleMinimize: (id) => void;
  floatWindow: (id) => void;
  updateWindowProps: (id, props) => void;
  clearPendingAction: (id) => void;
}
```

### 工具函数

```typescript
import { resolveWindowTitle, findMenuItem, collectParentMenuKeys } from 'react-workspace';
```

### 类型定义

```typescript
interface WindowConfig {
  id: string;
  type: string;        // 自定义窗口类型
  title: string;
  minimized: boolean;
  floating?: boolean;
  floatingPosition?: { x, y, width, height };
  props?: Record<string, unknown>;
}

interface SidebarMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  windowType?: string;   // 点击打开的窗口类型
  action?: string;       // 自定义操作标识
  children?: SidebarMenuItem[];
  props?: Record<string, unknown>;
}
```

## URL 状态格式

启用 `syncToUrl` 后，窗口状态保存在 URL 参数中：

```
/app/workspace?windows=[{"id":"...","type":"home","title":"首页"}]&active=window-id
```

浮动窗口的位置和最小化状态保存在 localStorage 中（避免 URL 过长）。

## 窗口操作

| 操作 | 方式 |
|------|------|
| 打开窗口 | 点击侧边栏菜单 / `openWindow()` |
| 切换窗口 | 点击标签 / `switchWindow(id)` |
| 最小化 | 标签 `-` 按钮 / `toggleMinimize(id)` |
| 浮动 | 标签浮动按钮 / 拖动标签 / `floatWindow(id)` |
| 关闭 | 标签 `×` 按钮 / `closeWindow(id)` |
| 批量管理 | 标签栏 `...` 菜单 / `batchManage(action)` |

## 开发

```bash
cd packages/react-workspace
yarn install
yarn build
yarn type-check
```

## 发布到 GitHub

### 第一步：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com/new)
2. 仓库名建议：`react-workspace`
3. 选择 **Public**
4. **不要**勾选 "Add a README"（保持空仓库）
5. 创建后复制仓库地址，例如：
   - HTTPS: `https://github.com/mxyg/react-workspace.git`
   - SSH: `git@github.com:mxyg/react-workspace.git`

### 第二步：修改 package.json 元信息

发布前把 `package.json` 里的占位地址改成你的：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/mxyg/react-workspace.git"
  },
  "homepage": "https://github.com/mxyg/react-workspace#readme",
  "bugs": {
    "url": "https://github.com/mxyg/react-workspace/issues"
  }
}
```

### 第三步：执行发布脚本

在本 monorepo 中：

```bash
cd packages/react-workspace
chmod +x scripts/publish-to-git.sh
./scripts/publish-to-git.sh https://github.com/mxyg/react-workspace.git
```

脚本会自动 `build` → `type-check` → 复制源码 → 推送到 GitHub。

加 `--yes` 可跳过确认：

```bash
./scripts/publish-to-git.sh https://github.com/mxyg/react-workspace.git --yes
```

### 第四步：启用 GitHub Pages（必做，否则 Deploy 会 404）

1. 打开 [Settings → Pages](https://github.com/mxyg/react-workspace/settings/pages)
2. **Build and deployment** → **Source** 选择 **GitHub Actions**（不是 Deploy from a branch）
3. 保存后，到 [Actions](https://github.com/mxyg/react-workspace/actions) → 选中失败的 **Deploy Demo** → **Re-run all jobs**

若未执行第 2 步，会出现如下错误：

```
Error: Failed to create deployment (status: 404)
Ensure GitHub Pages has been enabled
```

### 第五步：完善 GitHub 仓库

| 项目 | 建议 |
|------|------|
| Description | React IDE-style multi-window workspace component |
| Topics | `react` `workspace` `multi-window` `tabs` `floating-window` `ide` `antd` |
| About 网站 | 若发布 npm，填 npm 包地址 |

推送后 GitHub Actions 会自动：
- **CI** — build + type-check
- **Deploy Demo** — 部署到 GitHub Pages（需在 Settings → Pages → Source 选 GitHub Actions）

Demo 地址：`https://mxyg.github.io/react-workspace/`

> 首次部署需在 Settings → Pages 将 Source 设为 **GitHub Actions**，然后 Re-run 工作流。

### 后续更新

修改代码后重新执行发布脚本即可。若远程已有历史，建议改用正常 git 流程：

```bash
# 克隆独立仓库后
git remote add upstream /path/to/pms/packages/react-workspace  # 或手动 copy 文件
git add -A && git commit -m "feat: xxx" && git push
```

---

## 发布到 npm（可选）

```bash
cd packages/react-workspace

# 1. 注册 npm 账号 https://www.npmjs.com/signup
npm login

# 2. 确认包名未被占用（react-workspace 可能已被占用，可改用 scoped 名）
#    修改 package.json: "name": "@mxyg/react-workspace"

# 3. 发布
yarn build
npm publish --access public
```

安装方式：

```bash
# 公开包名
yarn add react-workspace

# scoped 包名
yarn add @mxyg/react-workspace
```

---

## 版本历史

### v1.2.0
- 修复侧边栏 footer 遮挡菜单、loading 遮罩覆盖侧边栏等问题
- 优化默认 UI（标签高亮、菜单选中态）
- 新增 `theme` prop 与 antd token 映射工具
- 新增 `renderSidebar` 与 `react-workspace/antd` 可选集成
- Demo 改为 Ant Design 示例

### v1.1.0
- 移除 antd 依赖，零 UI 框架
- 标签拖拽排序
- 键盘快捷键
- CSS 主题变量 + 暗色主题
- GitHub Pages Demo

## License

MIT
