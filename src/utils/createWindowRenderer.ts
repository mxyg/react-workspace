import { createElement, type ReactNode } from 'react';
import type { WindowConfig, WindowPanelComponent, WindowRenderContext, WorkspaceWindowsMap } from '../types';

export interface CreateWindowRendererOptions {
  /** 未匹配到窗口类型时的兜底组件 */
  fallback?: WindowPanelComponent;
}

/**
 * 将 windows 映射表转为 renderWindow，开箱即用：
 *
 * ```tsx
 * <Workspace menuItems={menu} windows={{ home: HomePage, settings: SettingsPage }} />
 * ```
 */
export function createWindowRenderer(
  windows: WorkspaceWindowsMap,
  options?: CreateWindowRendererOptions,
): (window: WindowConfig, ctx: WindowRenderContext) => ReactNode {
  const { fallback } = options ?? {};

  return (window, ctx) => {
    const Comp = windows[window.type] ?? fallback;
    if (!Comp) return null;
    return createElement(Comp, { window, ctx });
  };
}
