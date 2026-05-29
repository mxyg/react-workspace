// 样式入口
import './styles/theme.css';
import './styles/ui.css';
import './styles/workspace.css';
import './styles/workspace-sidebar.css';
import './styles/window-tabs.css';
import './styles/window-manager.css';
import './styles/window-container.css';
import './styles/floating-window.css';

export { Workspace, default as WorkspaceDefault } from './components/Workspace';
export { WorkspaceSidebar } from './components/WorkspaceSidebar';
export { WindowManager } from './components/WindowManager';
export { WindowTabs } from './components/WindowTabs';
export { FloatingWindow } from './components/FloatingWindow';
export { WindowContainer } from './components/WindowContainer';
export { useWorkspace } from './hooks/useWorkspace';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export { WorkspaceProvider, useWorkspaceContext, useWorkspaceContextOptional } from './context/WorkspaceContext';

export type {
  WindowConfig,
  WindowPosition,
  SidebarMenuItem,
  SidebarMenuDivider,
  SidebarMenuEntry,
  BatchWindowAction,
  DefaultWindowConfig,
  FloatingWindowDefaults,
  WindowRenderContext,
  UseWorkspaceOptions,
  UseWorkspaceReturn,
  WorkspaceProps,
  WorkspaceRef,
  WorkspaceSidebarRenderProps,
} from './types';

export type { WindowTabsProps } from './components/WindowTabs';
export type { FloatingWindowProps } from './components/FloatingWindow';
export type { WindowContainerProps } from './components/WindowContainer';
export type { WindowManagerProps } from './components/WindowManager';
export type { WorkspaceSidebarProps } from './components/WorkspaceSidebar';
export type { WorkspaceContextValue } from './context/WorkspaceContext';
export type { KeyboardShortcutsOptions } from './hooks/useKeyboardShortcuts';

export {
  fixWindowPosition,
  getAllWindowStatesFromStorage,
  saveWindowStateToStorage,
  updateTabClickOrder,
  pickNextActiveWindowId,
} from './utils/windowStorage';

export {
  findMenuItem,
  resolveWindowTitle,
  findMenuKeyByWindowType,
  collectParentMenuKeys,
  labelToString,
} from './utils/menuUtils';

export {
  themeToCssVars,
  mapAntdTokenToWorkspaceTheme,
  mapAntdTokenToCssVars,
} from './utils/theme';

export type { WorkspaceTheme } from './utils/theme';
