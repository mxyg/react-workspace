/**
 * Workspace 主组件
 */

import React, { useCallback, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Spinner } from '../ui/Spinner';
import { useWorkspace } from '../hooks/useWorkspace';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import WorkspaceSidebar from './WorkspaceSidebar';
import WindowManager from './WindowManager';
import { resolveWindowTitle, collectParentMenuKeys } from '../utils/menuUtils';
import { resolveDefaultWindow } from '../utils/resolveDefaultWindow';
import { createWindowRenderer } from '../utils/createWindowRenderer';
import { themeToCssVars } from '../utils/theme';
import type { WorkspaceProps, WorkspaceRef, WindowConfig, WindowRenderContext, WorkspaceSidebarRenderProps } from '../types';
import '../styles/theme.css';
import '../styles/workspace.css';

export const Workspace = forwardRef<WorkspaceRef, WorkspaceProps>(function Workspace(
  {
    workspaceId = 'default',
    menuItems,
    renderWindow: renderWindowProp,
    windows: windowsMap,
    sidebarHeader,
    sidebarFooter,
    defaultWindow: defaultWindowProp,
    loading = false,
    loadingTip = '加载中...',
    onAction,
    activeWindowType: externalActiveWindowType,
    emptyDescription,
    syncToUrl = false,
    preserveUrlParams = true,
    searchParams,
    setSearchParams,
    floatingDefaults,
    onWindowsChange,
    resolveTitle,
    onReady,
    siderWidth = 240,
    contentBackground,
    themeClassName,
    theme,
    renderSidebar,
    tabsContainer,
    className,
    style,
  },
  ref,
) {
  const defaultWindow = useMemo(
    () => resolveDefaultWindow(menuItems, defaultWindowProp),
    [menuItems, defaultWindowProp],
  );

  const renderWindow = useMemo(() => {
    if (renderWindowProp) return renderWindowProp;
    if (windowsMap) return createWindowRenderer(windowsMap);
    throw new Error('[react-workspace] 请提供 renderWindow 或 windows');
  }, [renderWindowProp, windowsMap]);

  const workspace = useWorkspace({
    workspaceId,
    defaultWindow,
    syncToUrl,
    preserveUrlParams,
    searchParams,
    setSearchParams,
    floatingDefaults,
    onWindowsChange,
    // 恢复窗口标题：使用者给的优先（详情类窗口要按参数拼），
    // 其次按类型去菜单里查，都查不到就退回类型本身。
    resolveTitle: (type, props) => resolveTitle?.(type, props) ?? resolveWindowTitle(menuItems, type),
  });

  const {
    windows,
    activeWindowId,
    openWindow,
    switchWindow,
    closeWindow,
    toggleMinimize,
    floatWindow,
    restoreWindow,
    updateFloatingPosition,
    focusWindow,
    batchManage,
    updateWindowProps,
    clearPendingAction,
    reorderWindows,
  } = workspace;

  const workspaceApi: WorkspaceRef = { workspaceId, ...workspace };
  useImperativeHandle(ref, () => workspaceApi, [workspaceId, windows, activeWindowId]);

  useEffect(() => {
    if (onReady && windows.length > 0) onReady({ workspaceId, ...workspace });
  }, [onReady, workspaceId, windows.length]);

  const activeWindowType = useMemo(() => {
    if (externalActiveWindowType !== undefined) return externalActiveWindowType;
    return windows.find((w) => w.id === activeWindowId)?.type;
  }, [externalActiveWindowType, windows, activeWindowId]);

  const handleMenuClick = useCallback(
    (windowType: string, props?: Record<string, unknown>) => {
      openWindow({ type: windowType, title: resolveWindowTitle(menuItems, windowType), minimized: false }, props);
    },
    [openWindow, menuItems],
  );

  const buildRenderContext = useCallback(
    (window: WindowConfig, active: boolean): WindowRenderContext => ({
      workspaceId,
      active,
      activeWindowId,
      windows,
      openWindow,
      switchWindow,
      closeWindow,
      toggleMinimize,
      floatWindow,
      updateWindowProps: (id, props) => updateWindowProps(id, props),
      clearPendingAction,
    }),
    [workspaceId, activeWindowId, windows, openWindow, switchWindow, closeWindow, toggleMinimize, floatWindow, updateWindowProps, clearPendingAction],
  );

  const contextValue = useMemo(
    () => ({ ...workspaceApi, buildRenderContext }),
    [workspaceId, windows, activeWindowId, buildRenderContext],
  );

  const bg = contentBackground ?? 'var(--rw-color-bg-tertiary)';
  const themeStyle = theme ? themeToCssVars(theme) : undefined;
  const rootStyle = { minHeight: '100vh', height: '100vh', display: 'flex' as const, ...themeStyle, ...style };

  const sidebarProps: WorkspaceSidebarRenderProps = {
    menuItems,
    onMenuClick: handleMenuClick,
    onAction,
    activeWindowType,
    header: sidebarHeader,
    footer: sidebarFooter,
    defaultOpenKeys: collectParentMenuKeys(menuItems),
    siderWidth,
  };

  return (
    <WorkspaceProvider value={contextValue}>
      <div
        className={`rw-workspace ${themeClassName || ''} ${className || ''}`.trim()}
        style={rootStyle}
      >
        {renderSidebar ? (
          renderSidebar(sidebarProps)
        ) : (
          <WorkspaceSidebar {...sidebarProps} />
        )}
        <main className="rw-workspace-main" style={{ background: bg }}>
          <Spinner spinning={loading} tip={loadingTip}>
            <WindowManager
              workspaceId={workspaceId}
              windows={windows}
              activeWindowId={activeWindowId}
              renderWindow={(win) => renderWindow(win, buildRenderContext(win, win.id === activeWindowId && !win.floating))}
              onSwitchWindow={switchWindow}
              onCloseWindow={closeWindow}
              onToggleMinimize={toggleMinimize}
              onBatchManage={batchManage}
              onOpenWindow={openWindow}
              onFloatWindow={floatWindow}
              onRestoreWindow={restoreWindow}
              onUpdateFloatingPosition={updateFloatingPosition}
              onFocusWindow={focusWindow}
              onReorderWindows={reorderWindows}
              emptyDescription={emptyDescription}
              tabsContainer={tabsContainer}
              themeClassName={themeClassName}
              floatingDefaults={floatingDefaults}
            />
          </Spinner>
        </main>
      </div>
    </WorkspaceProvider>
  );
});

export default Workspace;
