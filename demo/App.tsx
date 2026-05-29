import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfigProvider, theme, Switch, Typography, Card, Button, Space, Tag, Descriptions } from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  SettingOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { Workspace, useWorkspaceContext, mapAntdTokenToWorkspaceTheme } from '../src';
import { AntdWorkspaceSidebar } from '../src/integrations/antd';
import type { SidebarMenuEntry, WindowConfig, WindowRenderContext } from '../src';

const { Title, Paragraph, Text } = Typography;

const menuItems: SidebarMenuEntry[] = [
  { key: 'home', icon: <HomeOutlined />, label: '首页', windowType: 'home' },
  { type: 'divider' },
  {
    key: 'docs',
    icon: <BookOutlined />,
    label: '文档',
    children: [
      { key: 'guide', label: '使用指南', windowType: 'guide' },
      { key: 'antd', label: 'Ant Design 集成', windowType: 'antd-guide' },
      { key: 'shortcuts', label: '快捷键', windowType: 'shortcuts' },
    ],
  },
  { key: 'settings', icon: <SettingOutlined />, label: '设置', windowType: 'settings' },
];

function HomePanel() {
  const { openWindow } = useWorkspaceContext();
  return (
    <div className="demo-panel">
      <Title level={3}>react-workspace Demo</Title>
      <Paragraph>
        IDE 风格多窗口工作区。本 Demo 使用 <Tag color="blue">Ant Design 5</Tag> 作为 UI 框架示例。
      </Paragraph>
      <Card size="small" title="交互提示" style={{ maxWidth: 520 }}>
        <ul className="demo-list">
          <li>拖拽标签 <strong>水平</strong> → 调整顺序</li>
          <li>拖拽标签 <strong>远离标签栏</strong> → 浮动窗口</li>
          <li><kbd>Ctrl/Cmd + Tab</kbd> 切换窗口</li>
          <li><kbd>Ctrl/Cmd + W</kbd> 关闭当前窗口</li>
        </ul>
      </Card>
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={() => openWindow({ type: 'settings', title: '设置', minimized: false })}>
          打开设置
        </Button>
        <Button onClick={() => openWindow({ type: 'antd-guide', title: 'Ant Design 集成', minimized: false })}>
          查看 antd 集成
        </Button>
      </Space>
    </div>
  );
}

function AntdGuidePanel() {
  return (
    <div className="demo-panel">
      <Title level={4}>与 Ant Design 一起使用</Title>
      <Paragraph>库本身零 antd 依赖，但提供三种集成方式：</Paragraph>
      <Descriptions column={1} bordered size="small" style={{ maxWidth: 640 }}>
        <Descriptions.Item label="1. 主题同步">
          使用 <Text code>mapAntdTokenToWorkspaceTheme(token)</Text> 将 antd token 映射为 Workspace CSS 变量
        </Descriptions.Item>
        <Descriptions.Item label="2. 自定义侧边栏">
          通过 <Text code>renderSidebar</Text> 使用 <Text code>AntdWorkspaceSidebar</Text>
        </Descriptions.Item>
        <Descriptions.Item label="3. 窗口内容">
          在 <Text code>renderWindow</Text> 中自由使用任意 antd 组件（如本 Demo）
        </Descriptions.Item>
      </Descriptions>
      <pre className="demo-code">{`import { ConfigProvider, theme } from 'antd';
import { Workspace, mapAntdTokenToWorkspaceTheme } from 'react-workspace';
import { AntdWorkspaceSidebar } from 'react-workspace/antd';

function App() {
  const { token } = theme.useToken();
  return (
    <Workspace
      theme={mapAntdTokenToWorkspaceTheme(token)}
      renderSidebar={(props) => (
        <AntdWorkspaceSidebar {...props} theme="light" />
      )}
      renderWindow={(win) => <YourAntdPage type={win.type} />}
      ...
    />
  );
}`}</pre>
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
          <Title level={4}>快速开始</Title>
          <pre className="demo-code">{`yarn add react-workspace antd @ant-design/icons
import { Workspace } from 'react-workspace';
import 'react-workspace/style.css';`}</pre>
        </div>
      );
    case 'antd-guide':
      return <AntdGuidePanel />;
    case 'shortcuts':
      return (
        <div className="demo-panel">
          <Title level={4}>快捷键</Title>
          <Descriptions column={1} bordered size="small" style={{ maxWidth: 400 }}>
            <Descriptions.Item label="Ctrl/Cmd + W">关闭当前窗口</Descriptions.Item>
            <Descriptions.Item label="Ctrl/Cmd + Tab">下一个窗口</Descriptions.Item>
            <Descriptions.Item label="Ctrl/Cmd + Shift + Tab">上一个窗口</Descriptions.Item>
          </Descriptions>
        </div>
      );
    case 'settings':
      return (
        <div className="demo-panel">
          <Title level={4}>设置</Title>
          <Paragraph>当前窗口 active: <Tag>{String(ctx.active)}</Tag></Paragraph>
        </div>
      );
    default:
      return <div className="demo-panel">未知: {win.type}</div>;
  }
}

function WorkspaceDemo({ isDark }: { isDark: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = theme.useToken();
  const workspaceTheme = useMemo(() => mapAntdTokenToWorkspaceTheme(token), [token]);

  return (
    <Workspace
      workspaceId="demo"
      menuItems={menuItems}
      defaultWindow={{ type: 'home', title: '首页' }}
      syncToUrl
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      theme={workspaceTheme}
      themeClassName={isDark ? 'rw-theme-dark' : undefined}
      renderSidebar={(props) => (
        <AntdWorkspaceSidebar {...props} theme={isDark ? 'dark' : 'light'} />
      )}
      sidebarHeader={
        <div className="demo-header">
          <Text strong>react-workspace</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Ant Design Demo</Text>
        </div>
      }
      sidebarFooter={
        <div className="demo-footer">
          <a href="https://github.com/mxyg/react-workspace" target="_blank" rel="noreferrer">
            <GithubOutlined /> GitHub
          </a>
        </div>
      }
      renderWindow={renderWindow}
    />
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { borderRadius: 6 },
      }}
    >
      <div className="demo-app">
        <div className="demo-toolbar">
          <Text type="secondary">主题</Text>
          <Switch checked={isDark} onChange={setIsDark} checkedChildren="暗" unCheckedChildren="亮" />
        </div>
        <WorkspaceDemo isDark={isDark} />
      </div>
    </ConfigProvider>
  );
}
