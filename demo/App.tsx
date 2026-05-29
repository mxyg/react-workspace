import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workspace, useWorkspaceContext } from '../src';
import type { SidebarMenuEntry, WindowConfig, WindowRenderContext } from '../src';

const menuItems: SidebarMenuEntry[] = [
  { key: 'home', icon: <span>🏠</span>, label: '首页', windowType: 'home' },
  { type: 'divider' },
  {
    key: 'docs',
    icon: <span>📄</span>,
    label: '文档',
    children: [
      { key: 'guide', label: '使用指南', windowType: 'guide' },
      { key: 'shortcuts', label: '快捷键', windowType: 'shortcuts' },
    ],
  },
  { key: 'settings', icon: <span>⚙️</span>, label: '设置', windowType: 'settings' },
];

function HomePanel() {
  const { openWindow } = useWorkspaceContext();
  return (
    <div className="demo-panel">
      <h2>react-workspace Demo</h2>
      <p>IDE 风格多窗口工作区，零 UI 框架依赖。</p>
      <ul>
        <li>拖拽标签 <strong>水平</strong> → 调整顺序</li>
        <li>拖拽标签 <strong>远离标签栏</strong> → 浮动窗口</li>
        <li><kbd>Ctrl/Cmd + Tab</kbd> 切换窗口</li>
        <li><kbd>Ctrl/Cmd + W</kbd> 关闭当前窗口</li>
      </ul>
      <button type="button" onClick={() => openWindow({ type: 'settings', title: '设置', minimized: false })}>
        打开设置窗口
      </button>
    </div>
  );
}

function renderWindow(win: WindowConfig, ctx: WindowRenderContext) {
  switch (win.type) {
    case 'home':
      return <HomePanel />;
    case 'guide':
      return (
        <div className="demo-panel">
          <h3>使用指南</h3>
          <pre>{`import { Workspace } from 'react-workspace';
import 'react-workspace/style.css';`}</pre>
        </div>
      );
    case 'shortcuts':
      return (
        <div className="demo-panel">
          <h3>快捷键</h3>
          <table className="demo-table">
            <tbody>
              <tr><td>Ctrl/Cmd + W</td><td>关闭当前窗口</td></tr>
              <tr><td>Ctrl/Cmd + Tab</td><td>下一个窗口</td></tr>
              <tr><td>Ctrl/Cmd + Shift + Tab</td><td>上一个窗口</td></tr>
            </tbody>
          </table>
        </div>
      );
    case 'settings':
      return (
        <div className="demo-panel">
          <h3>设置</h3>
          <p>active: {String(ctx.active)}</p>
        </div>
      );
    default:
      return <div className="demo-panel">未知: {win.type}</div>;
  }
}

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dark, setDark] = useState(false);

  return (
    <Workspace
      workspaceId="demo"
      menuItems={menuItems}
      defaultWindow={{ type: 'home', title: '首页' }}
      syncToUrl
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      themeClassName={dark ? 'rw-theme-dark' : undefined}
      sidebarHeader={
        <div className="demo-header">
          <strong>react-workspace</strong>
          <label className="demo-theme-toggle">
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
            暗色
          </label>
        </div>
      }
      sidebarFooter={<div className="demo-footer">MIT · GitHub Pages Demo</div>}
      renderWindow={renderWindow}
    />
  );
}
