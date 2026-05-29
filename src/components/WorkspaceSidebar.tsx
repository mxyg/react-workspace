/**
 * 工作区侧边栏 - 无 antd 依赖
 */

import React, { useState, useMemo } from 'react';
import { IconMenuFold, IconMenuUnfold, IconChevronDown } from '../ui/Icons';
import type { SidebarMenuEntry, SidebarMenuItem } from '../types';
import { findMenuKeyByWindowType, labelToString } from '../utils/menuUtils';
import '../styles/workspace-sidebar.css';

export interface WorkspaceSidebarProps {
  menuItems: SidebarMenuEntry[];
  onMenuClick: (windowType: string, props?: Record<string, unknown>) => void;
  onAction?: (action: string) => void;
  activeWindowType?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  defaultOpenKeys?: string[];
  siderWidth?: number;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function isDivider(item: SidebarMenuEntry): item is { type: 'divider'; key?: string } {
  return 'type' in item && item.type === 'divider';
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  menuItems,
  onMenuClick,
  onAction,
  activeWindowType,
  header,
  footer,
  defaultOpenKeys = [],
  siderWidth = 240,
  onCollapsedChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(defaultOpenKeys));

  const selectedKey = useMemo(() => {
    if (!activeWindowType) return null;
    return findMenuKeyByWindowType(menuItems, activeWindowType);
  }, [activeWindowType, menuItems]);

  const toggleCollapsed = () => {
    setCollapsed((v) => { onCollapsedChange?.(!v); return !v; });
  };

  const toggleOpen = (key: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activateItem = (item: SidebarMenuItem) => {
    if (item.disabled) return;
    if (item.windowType) {
      onMenuClick(item.windowType, item.props);
      return;
    }
    if (item.action && onAction) {
      onAction(item.action);
      return;
    }
    if (item.children?.length) toggleOpen(item.key);
  };

  const renderItems = (items: SidebarMenuEntry[], depth = 0) =>
    items.map((entry, i) => {
      if (isDivider(entry)) {
        return <div key={entry.key ?? `div-${i}`} className="rw-menu-divider" />;
      }
      const item = entry as SidebarMenuItem;
      const hasChildren = !!item.children?.length;
      const isOpen = openKeys.has(item.key);
      const isSelected = item.key === selectedKey;

      return (
        <div key={item.key} className="rw-menu-group">
          <button
            type="button"
            className={`rw-menu-item ${isSelected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`}
            style={{ paddingLeft: collapsed ? 12 : 12 + depth * 16 }}
            onClick={() => activateItem(item)}
            disabled={item.disabled}
            title={collapsed ? labelToString(item.label) : undefined}
          >
            {item.icon && <span className="rw-menu-icon">{item.icon}</span>}
            {!collapsed && <span className="rw-menu-label">{item.label}</span>}
            {!collapsed && hasChildren && (
              <span
                className={`rw-menu-arrow ${isOpen ? 'open' : ''}`}
                onClick={(e) => toggleOpen(item.key, e)}
                role="presentation"
              >
                <IconChevronDown size={10} />
              </span>
            )}
          </button>
          {!collapsed && hasChildren && isOpen && (
            <div className="rw-menu-children">{renderItems(item.children!, depth + 1)}</div>
          )}
        </div>
      );
    });

  const width = collapsed ? 64 : siderWidth;

  return (
    <div className="rw-workspace-sidebar-wrapper">
      <aside className="rw-workspace-sider" style={{ width }}>
        {header && <div className={`rw-workspace-sidebar-header ${collapsed ? 'collapsed' : ''}`}>{header}</div>}
        <nav className="rw-workspace-sidebar-menu">{renderItems(menuItems)}</nav>
        {footer && <div className={`rw-workspace-sidebar-footer ${collapsed ? 'collapsed' : ''}`}>{footer}</div>}
      </aside>
      <button
        type="button"
        className="rw-workspace-collapse-button"
        style={{ left: width }}
        onClick={toggleCollapsed}
        title={collapsed ? '展开导航' : '折叠导航'}
      >
        {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
      </button>
    </div>
  );
};

export default WorkspaceSidebar;
