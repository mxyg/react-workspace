/**
 * Demo 入口 — 展示开箱即用的最简集成方式
 *
 * 核心只需三步：
 * 1. 配置 menuItems（侧边栏菜单）
 * 2. 配置 windows（窗口类型 → 组件映射）
 * 3. 渲染 <AntdWorkspace />
 *
 * 可选：syncToUrl + react-router 实现刷新恢复；dark 切换暗色主题
 */
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Switch, Typography } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { AntdWorkspace } from '../src/integrations/AntdWorkspace';
import { menuItems } from './menu';
import { windows } from './windows';

const { Text } = Typography;

/** 工作区主体：AntdWorkspace 一行搞定侧边栏、标签栏、主题同步 */
function DemoWorkspace({ dark, onDarkChange }: { dark: boolean; onDarkChange: (v: boolean) => void }) {
  // URL 同步（可选）：需要外层包裹 <HashRouter>，见 main.tsx
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <AntdWorkspace
      workspaceId="demo"
      menuItems={menuItems}
      windows={windows}
      dark={dark}
      syncToUrl
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      sidebarHeader={
        <div className="demo-header">
          <Text strong>@liuman/react-workspace</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>开箱即用 Demo</Text>
        </div>
      }
      sidebarFooter={
        <div className="demo-footer">
          <div className="demo-footer-theme">
            <Text type="secondary">主题</Text>
            <Switch
              size="small"
              checked={dark}
              onChange={onDarkChange}
              checkedChildren="暗"
              unCheckedChildren="亮"
            />
          </div>
          <a href="https://github.com/mxyg/react-workspace" target="_blank" rel="noreferrer">
            <GithubOutlined /> GitHub
          </a>
        </div>
      }
    />
  );
}

export default function App() {
  const [dark, setDark] = useState(false);

  return (
    <div className={`demo-app${dark ? ' demo-app-dark' : ''}`}>
      <DemoWorkspace dark={dark} onDarkChange={setDark} />
    </div>
  );
}
