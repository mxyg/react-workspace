/**
 * react-workspace 使用示例
 */

import React, { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workspace, useWorkspaceContext } from 'react-workspace';
import type { SidebarMenuEntry, WindowConfig, WindowRenderContext, WorkspaceRef } from 'react-workspace';
import 'react-workspace/style.css';

const menuItems: SidebarMenuEntry[] = [
  { key: 'home', icon: <span>🏠</span>, label: '首页', windowType: 'home' },
  { type: 'divider' },
  {
    key: 'files',
    icon: <span>📁</span>,
    label: '文件',
    children: [
      { key: 'files-list', label: '文件列表', windowType: 'files-list' },
    ],
  },
];

function HomePage() {
  const { openWindow } = useWorkspaceContext();
  return (
    <div style={{ padding: 24 }}>
      <h2>react-workspace</h2>
      <button type="button" onClick={() => openWindow({ type: 'files-list', title: '文件列表', minimized: false })}>
        打开文件列表
      </button>
    </div>
  );
}

function renderWindow(window: WindowConfig, _ctx: WindowRenderContext) {
  if (window.type === 'home') return <HomePage />;
  return <div style={{ padding: 24 }}>{window.title}</div>;
}

export default function WorkspaceExample() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ref = useRef<WorkspaceRef>(null);

  return (
    <Workspace
      ref={ref}
      workspaceId="example"
      menuItems={menuItems}
      syncToUrl
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      renderWindow={renderWindow}
    />
  );
}
