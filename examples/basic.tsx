/**
 * 零依赖最简示例（不使用 Ant Design）
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Workspace } from '../src';
import type { SidebarMenuEntry, WorkspaceWindowsMap } from '../src';

const menuItems: SidebarMenuEntry[] = [
  { key: 'home', icon: <span>🏠</span>, label: '首页', windowType: 'home' },
  { type: 'divider' },
  { key: 'about', icon: <span>ℹ️</span>, label: '关于', windowType: 'about' },
];

function HomePage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>react-workspace</h2>
      <p>只需 menuItems + windows 即可运行。</p>
    </div>
  );
}

function AboutPage() {
  return <div style={{ padding: 24 }}>关于页面</div>;
}

const windows: WorkspaceWindowsMap = {
  home: HomePage,
  about: AboutPage,
};

export default function WorkspaceExample() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Workspace
      menuItems={menuItems}
      windows={windows}
      syncToUrl
      searchParams={searchParams}
      setSearchParams={setSearchParams}
    />
  );
}
