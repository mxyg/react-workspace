import type { DefaultWindowConfig, SidebarMenuEntry, SidebarMenuItem } from '../types';
import { labelToString } from './menuUtils';

function isDivider(item: SidebarMenuEntry): item is { type: 'divider'; key?: string } {
  return 'type' in item && item.type === 'divider';
}

/** 从菜单中取第一个带 windowType 的项 */
export function findFirstMenuItemWithWindowType(items: SidebarMenuEntry[]): SidebarMenuItem | null {
  for (const entry of items) {
    if (isDivider(entry)) continue;
    const item = entry as SidebarMenuItem;
    if (item.windowType) return item;
    if (item.children) {
      const found = findFirstMenuItemWithWindowType(item.children);
      if (found) return found;
    }
  }
  return null;
}

/** 根据菜单自动推断默认窗口，也可手动覆盖 */
export function resolveDefaultWindow(
  menuItems: SidebarMenuEntry[],
  override?: DefaultWindowConfig,
): DefaultWindowConfig {
  if (override) return { minimized: false, ...override };

  const first = findFirstMenuItemWithWindowType(menuItems);
  if (!first?.windowType) {
    return { type: 'home', title: '首页', minimized: false };
  }

  const title = labelToString(first.label) || first.key;
  return { type: first.windowType, title, minimized: false };
}
