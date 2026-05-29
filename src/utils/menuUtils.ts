/**
 * 菜单工具函数
 */

import type { ReactNode } from 'react';
import type { SidebarMenuItem } from '../types';

export type SidebarMenuEntry = SidebarMenuItem | { type: 'divider'; key?: string };

/** 在菜单树中查找指定 key 的菜单项 */
export function findMenuItem(
  items: SidebarMenuEntry[],
  targetKey: string,
): SidebarMenuItem | null {
  for (const item of items) {
    if ('type' in item && item.type === 'divider') continue;
    const menuItem = item as SidebarMenuItem;
    if (menuItem.key === targetKey) return menuItem;
    if (menuItem.children) {
      const found = findMenuItem(menuItem.children, targetKey);
      if (found) return found;
    }
  }
  return null;
}

/** 根据窗口类型解析菜单标题 */
export function resolveWindowTitle(
  items: SidebarMenuEntry[],
  windowType: string,
  fallback?: string,
): string {
  const findTitle = (list: SidebarMenuEntry[]): string | null => {
    for (const item of list) {
      if ('type' in item && item.type === 'divider') continue;
      const menuItem = item as SidebarMenuItem;
      if (menuItem.windowType === windowType) {
        return typeof menuItem.label === 'string' ? menuItem.label : menuItem.key;
      }
      if (menuItem.children) {
        const t = findTitle(menuItem.children);
        if (t) return t;
      }
    }
    return null;
  };
  return findTitle(items) ?? fallback ?? windowType;
}

/** 根据窗口类型查找菜单 key（用于高亮） */
export function findMenuKeyByWindowType(
  items: SidebarMenuEntry[],
  windowType: string,
): string | null {
  for (const item of items) {
    if ('type' in item && item.type === 'divider') continue;
    const menuItem = item as SidebarMenuItem;
    if (menuItem.windowType === windowType) return menuItem.key;
    if (menuItem.children) {
      const found = findMenuKeyByWindowType(menuItem.children, windowType);
      if (found) return found;
    }
  }
  return null;
}

/** 提取菜单中所有可展开的父级 key */
export function collectParentMenuKeys(items: SidebarMenuEntry[]): string[] {
  const keys: string[] = [];
  for (const item of items) {
    if ('type' in item && item.type === 'divider') continue;
    const menuItem = item as SidebarMenuItem;
    if (menuItem.children?.length) {
      keys.push(menuItem.key);
    }
  }
  return keys;
}

/** 将 label 转为可读字符串 */
export function labelToString(label: ReactNode): string {
  if (typeof label === 'string' || typeof label === 'number') return String(label);
  return '';
}
