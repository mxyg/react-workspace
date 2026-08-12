/**
 * react-workspace 类型定义
 */

import type { ReactNode, Dispatch, SetStateAction, CSSProperties, Ref, ComponentType } from 'react';
import type { WorkspaceTheme } from './utils/theme';

/** 窗口位置和大小 */
export interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 浮动窗口默认尺寸 */
export interface FloatingWindowDefaults {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
}

/** 窗口配置 */
export interface WindowConfig {
  id: string;
  /** 窗口类型标识，由使用者自定义 */
  type: string;
  title: string;
  minimized: boolean;
  floating?: boolean;
  floatingPosition?: WindowPosition;
  floatingZIndex?: number;
  props?: Record<string, unknown>;
  pendingAction?: string;
  pendingDragStart?: { x: number; y: number };
}

/** 侧边栏菜单项 */
export interface SidebarMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  /** 点击后打开的窗口类型 */
  windowType?: string;
  children?: SidebarMenuEntry[];
  /** 自定义操作标识 */
  action?: string;
  /** 传递给窗口的额外属性 */
  props?: Record<string, unknown>;
  /** 是否禁用 */
  disabled?: boolean;
}

/** 侧边栏分隔线 */
export interface SidebarMenuDivider {
  type: 'divider';
  key?: string;
}

export type SidebarMenuEntry = SidebarMenuItem | SidebarMenuDivider;

/** 批量窗口管理操作 */
export type BatchWindowAction =
  | 'close-all'
  | 'close-others'
  | 'close-left'
  | 'close-right'
  | 'minimize-all'
  | 'restore-all'
  | 'reset-windows';

/** 默认窗口配置（不含 id） */
export interface DefaultWindowConfig {
  type: string;
  title: string;
  minimized?: boolean;
}

/** 窗口渲染上下文 */
export interface WindowRenderContext {
  workspaceId: string;
  active: boolean;
  activeWindowId: string | null;
  windows: WindowConfig[];
  openWindow: (config: Omit<WindowConfig, 'id'>, props?: Record<string, unknown>) => void;
  switchWindow: (windowId: string) => void;
  closeWindow: (windowId: string) => void;
  toggleMinimize: (windowId: string) => void;
  floatWindow: (windowId: string, mousePosition?: { x: number; y: number }) => void;
  updateWindowProps: (windowId: string, props: Record<string, unknown>) => void;
  clearPendingAction: (windowId: string) => void;
}

/** useWorkspace 配置 */
export interface UseWorkspaceOptions {
  workspaceId: string;
  defaultWindow?: DefaultWindowConfig;
  /** 是否同步窗口状态到 URL searchParams */
  syncToUrl?: boolean;
  /** syncToUrl 为 true 时，保留 URL 中其他参数 */
  preserveUrlParams?: boolean;
  searchParams?: URLSearchParams;
  setSearchParams?: (params: URLSearchParams, options?: { replace?: boolean }) => void;
  storageKeyPrefix?: string;
  /** 浮动窗口默认尺寸 */
  floatingDefaults?: FloatingWindowDefaults;
  /** 窗口列表变化回调 */
  onWindowsChange?: (windows: WindowConfig[], activeWindowId: string | null) => void;
}

/** useWorkspace 返回值 */
export interface UseWorkspaceReturn {
  windows: WindowConfig[];
  activeWindowId: string | null;
  openWindow: (config: Omit<WindowConfig, 'id'>, props?: Record<string, unknown>) => void;
  switchWindow: (windowId: string) => void;
  closeWindow: (windowId: string) => void;
  toggleMinimize: (windowId: string) => void;
  floatWindow: (windowId: string, mousePosition?: { x: number; y: number }) => void;
  restoreWindow: (windowId: string, insertIndex?: number) => void;
  updateFloatingPosition: (windowId: string, position: WindowPosition) => void;
  focusWindow: (windowId: string) => void;
  batchManage: (action: BatchWindowAction) => void;
  updateWindowProps: (windowId: string, props: Record<string, unknown>) => void;
  updateWindowTitle: (windowId: string, title: string) => void;
  clearPendingAction: (windowId: string) => void;
  setWindows: Dispatch<SetStateAction<WindowConfig[]>>;
  setActiveWindowId: Dispatch<SetStateAction<string | null>>;
  resetWorkspace: () => void;
  reorderWindows: (fromIndex: number, toIndex: number) => void;
}

/** Workspace 组件暴露的 Ref */
export interface WorkspaceRef extends UseWorkspaceReturn {
  workspaceId: string;
}

/** 自定义侧边栏 renderSidebar 接收的参数 */
export interface WorkspaceSidebarRenderProps {
  menuItems: SidebarMenuEntry[];
  onMenuClick: (windowType: string, props?: Record<string, unknown>) => void;
  onAction?: (action: string) => void;
  activeWindowType?: string;
  header?: ReactNode;
  footer?: ReactNode;
  defaultOpenKeys?: string[];
  siderWidth?: number;
}

/** 窗口面板组件接收的 props */
export interface WindowPanelProps {
  window: WindowConfig;
  ctx: WindowRenderContext;
}

/** 窗口类型 → 面板组件映射（开箱即用） */
export type WindowPanelComponent = ComponentType<WindowPanelProps>;
export type WorkspaceWindowsMap = Record<string, WindowPanelComponent>;

/** Workspace 组件 Props */
export interface WorkspaceProps {
  /** 工作区唯一标识，用于 localStorage / URL 隔离，默认 `default` */
  workspaceId?: string;
  /** 侧边栏菜单项 */
  menuItems: SidebarMenuEntry[];
  /**
   * 渲染窗口内容（与 windows 二选一）
   * 需要完全自定义渲染逻辑时使用
   */
  renderWindow?: (window: WindowConfig, context: WindowRenderContext) => ReactNode;
  /**
   * 窗口类型 → 组件映射（与 renderWindow 二选一，推荐）
   * @example windows={{ home: HomePage, settings: SettingsPage }}
   */
  windows?: WorkspaceWindowsMap;
  /** 侧边栏顶部区域（如项目切换器） */
  sidebarHeader?: ReactNode;
  /** 侧边栏底部区域（如用户信息） */
  sidebarFooter?: ReactNode;
  /** 默认打开的窗口 */
  defaultWindow?: DefaultWindowConfig;
  /** 加载状态 */
  loading?: boolean;
  loadingTip?: string;
  /** 自定义操作回调 */
  onAction?: (action: string) => void;
  /** 当前激活的窗口类型（用于菜单高亮，不传则自动推断） */
  activeWindowType?: string;
  /** 空状态描述 */
  emptyDescription?: ReactNode;
  /** 是否同步 URL */
  syncToUrl?: boolean;
  preserveUrlParams?: boolean;
  searchParams?: URLSearchParams;
  setSearchParams?: (params: URLSearchParams, options?: { replace?: boolean }) => void;
  /** 浮动窗口默认尺寸 */
  floatingDefaults?: FloatingWindowDefaults;
  /** 窗口列表变化回调 */
  onWindowsChange?: (windows: WindowConfig[], activeWindowId: string | null) => void;
  /** 工作区就绪回调，可获取完整 API */
  onReady?: (api: WorkspaceRef) => void;
  /** 暴露 ref */
  ref?: Ref<WorkspaceRef>;
  /**
   * 把标签栏渲染到工作区外部的某个容器里（传 DOM 节点，内部用 portal 挂过去）。
   *
   * 用途是省掉一整行：宿主应用自己有顶栏时，标签栏另起一行会让屏幕上出现
   * 两条横杠。给顶栏里放一个空 div、把它传进来，标签栏就落在顶栏那一行，
   * 拖拽排序、拖出浮窗、批量管理这些交互仍然由工作区自己管。
   * 传 null / 不传则照旧渲染在内容区上方。
   */
  tabsContainer?: HTMLElement | null;
  /** 侧边栏宽度 */
  siderWidth?: number;
  /** 内容区背景色 */
  contentBackground?: string;
  /** 主题 class，如 rw-theme-dark */
  themeClassName?: string;
  /** 通过 props 覆盖 CSS 变量主题（可与 antd token 映射配合） */
  theme?: WorkspaceTheme;
  /** 完全自定义侧边栏，例如使用 Ant Design Menu */
  renderSidebar?: (props: WorkspaceSidebarRenderProps) => ReactNode;
  className?: string;
  style?: CSSProperties;
}
