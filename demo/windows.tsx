/**
 * 窗口面板组件
 *
 * 每个组件对应 menu.tsx 里的一项 windowType。
 * 在组件内可通过 useWorkspaceContext() 调用 openWindow / closeWindow 等 API。
 */
import React from 'react';
import { Typography, Card, Button, Space, Tag, Descriptions } from 'antd';
import { useWorkspaceContext } from '../src';
import type { WindowPanelProps, WorkspaceWindowsMap } from '../src';

const { Title, Paragraph, Text } = Typography;

/** 首页：展示交互说明，演示编程式打开窗口 */
function HomePanel() {
  const { openWindow } = useWorkspaceContext();

  return (
    <div className="demo-panel">
      <Title level={3}>react-workspace Demo</Title>
      <Paragraph>
        IDE 风格多窗口工作区，开箱即用。本 Demo 使用 <Tag color="blue">AntdWorkspace</Tag>，约 20 行代码即可跑起来。
      </Paragraph>
      <Card size="small" title="交互提示" style={{ maxWidth: 520 }}>
        <ul className="demo-list">
          <li>拖拽标签 <strong>水平</strong> → 调整顺序</li>
          <li>拖拽标签 <strong>远离标签栏</strong> → 浮动窗口</li>
        </ul>
      </Card>
      <Space style={{ marginTop: 16 }}>
        <Button
          type="primary"
          onClick={() => openWindow({ type: 'settings', title: '设置', minimized: false })}
        >
          打开设置
        </Button>
        <Button
          onClick={() => openWindow({ type: 'antd-guide', title: 'Ant Design 集成', minimized: false })}
        >
          查看集成说明
        </Button>
      </Space>
    </div>
  );
}

/** 快速开始：展示最简调用代码 */
function GuidePanel() {
  return (
    <div className="demo-panel">
      <Title level={4}>最简用法（Ant Design）</Title>
      <pre className="demo-code">{`import { AntdWorkspace } from '@liuman/react-workspace/antd';
import '@liuman/react-workspace/style.css';

function HomePage() {
  return <div style={{ padding: 24 }}>首页</div>;
}

export default function App() {
  return (
    <AntdWorkspace
      menuItems={[
        { key: 'home', label: '首页', windowType: 'home' },
      ]}
      windows={{ home: HomePage }}
    />
  );
}`}</pre>
    </div>
  );
}

/** Ant Design 集成说明 */
function AntdGuidePanel() {
  return (
    <div className="demo-panel">
      <Title level={4}>AntdWorkspace 已内置</Title>
      <Descriptions column={1} bordered size="small" style={{ maxWidth: 640 }}>
        <Descriptions.Item label="ConfigProvider">
          自动包裹 antd 主题，支持 <Text code>dark</Text> 切换
        </Descriptions.Item>
        <Descriptions.Item label="侧边栏">
          内置 <Text code>AntdWorkspaceSidebar</Text>，无需手写 renderSidebar
        </Descriptions.Item>
        <Descriptions.Item label="主题同步">
          自动将 antd token 映射为工作区 CSS 变量
        </Descriptions.Item>
        <Descriptions.Item label="windows 映射">
          用 <Text code>windows=&#123; home: HomePage &#125;</Text> 替代 renderWindow switch
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
}

/** 设置页：演示 ctx.active 等窗口上下文 */
function Settings({ ctx }: WindowPanelProps) {
  return (
    <div className="demo-panel">
      <Title level={4}>设置</Title>
      <Paragraph>当前窗口是否激活：<Tag>{String(ctx.active)}</Tag></Paragraph>
    </div>
  );
}

/**
 * 窗口类型 → 组件映射
 * key 必须与 menu.tsx 中的 windowType 一致
 */
export const windows: WorkspaceWindowsMap = {
  home: HomePanel,
  guide: GuidePanel,
  'antd-guide': AntdGuidePanel,
  settings: Settings,
};
