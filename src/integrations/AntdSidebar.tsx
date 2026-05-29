/**
 * 可选：使用 Ant Design Menu 作为侧边栏（需安装 antd + @ant-design/icons）
 *
 * @example
 * import { AntdWorkspaceSidebar } from 'react-workspace/antd';
 */

import React, { useMemo, useState } from 'react';
import { Layout, Menu } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { SidebarMenuEntry, SidebarMenuItem } from '../types';
import { findMenuKeyByWindowType } from '../utils/menuUtils';
import '../styles/workspace-sidebar.css';
import '../styles/integrations/antd-sidebar.css';

const { Sider } = Layout;

function isDivider(item: SidebarMenuEntry): item is { type: 'divider'; key?: string } {
  return 'type' in item && item.type === 'divider';
}

function toAntdItems(items: SidebarMenuEntry[]): MenuProps['items'] {
  return items.map((entry, i) => {
    if (isDivider(entry)) return { type: 'divider' as const, key: entry.key ?? `d-${i}` };
    const item = entry as SidebarMenuItem;
    return {
      key: item.key,
      icon: item.icon,
      label: item.label,
      disabled: item.disabled,
      children: item.children ? toAntdItems(item.children) : undefined,
    };
  });
}

function findItem(items: SidebarMenuEntry[], key: string): SidebarMenuItem | null {
  for (const entry of items) {
    if (isDivider(entry)) continue;
    const item = entry as SidebarMenuItem;
    if (item.key === key) return item;
    if (item.children) {
      const found = findItem(item.children, key);
      if (found) return found;
    }
  }
  return null;
}

export interface AntdWorkspaceSidebarProps {
  menuItems: SidebarMenuEntry[];
  onMenuClick: (windowType: string, props?: Record<string, unknown>) => void;
  onAction?: (action: string) => void;
  activeWindowType?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  defaultOpenKeys?: string[];
  siderWidth?: number;
  theme?: 'light' | 'dark';
}

export const AntdWorkspaceSidebar: React.FC<AntdWorkspaceSidebarProps> = ({
  menuItems,
  onMenuClick,
  onAction,
  activeWindowType,
  header,
  footer,
  defaultOpenKeys = [],
  siderWidth = 240,
  theme = 'light',
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const selectedKeys = useMemo(() => {
    if (!activeWindowType) return [];
    const key = findMenuKeyByWindowType(menuItems, activeWindowType);
    return key ? [key] : [];
  }, [activeWindowType, menuItems]);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    const item = findItem(menuItems, key);
    if (!item || item.disabled) return;
    if (item.windowType) onMenuClick(item.windowType, item.props);
    else if (item.action && onAction) onAction(item.action);
  };

  return (
    <div className="rw-workspace-sidebar-wrapper rw-antd-sidebar">
      <Sider
        width={siderWidth}
        collapsed={collapsed}
        collapsedWidth={64}
        theme={theme}
        className="rw-antd-sider"
      >
        {header && <div className={`rw-workspace-sidebar-header ${collapsed ? 'collapsed' : ''}`}>{header}</div>}
        <div className="rw-antd-menu-wrap">
          <Menu
            mode="inline"
            theme={theme}
            selectedKeys={selectedKeys}
            defaultOpenKeys={defaultOpenKeys}
            items={toAntdItems(menuItems)}
            onClick={onClick}
            inlineCollapsed={collapsed}
          />
        </div>
        {footer && <div className={`rw-workspace-sidebar-footer ${collapsed ? 'collapsed' : ''}`}>{footer}</div>}
      </Sider>
      <button
        type="button"
        className="rw-workspace-collapse-button"
        style={{ left: collapsed ? 64 : siderWidth }}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? '展开' : '折叠'}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </button>
    </div>
  );
};

export default AntdWorkspaceSidebar;
