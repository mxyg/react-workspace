/**
 * 窗口管理器
 */

import React from 'react';
import { EmptyState } from '../ui/EmptyState';
import type { WindowConfig, WindowPosition, WindowRenderContext, BatchWindowAction, FloatingWindowDefaults } from '../types';
import WindowContainer from './WindowContainer';
import WindowTabs from './WindowTabs';
import FloatingWindow from './FloatingWindow';
import '../styles/window-manager.css';

export interface WindowManagerProps {
  workspaceId: string;
  windows: WindowConfig[];
  activeWindowId: string | null;
  renderWindow: (window: WindowConfig, context: WindowRenderContext) => React.ReactNode;
  onSwitchWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
  onToggleMinimize: (windowId: string) => void;
  onBatchManage: (action: BatchWindowAction) => void;
  onOpenWindow: (config: Omit<WindowConfig, 'id'>, props?: Record<string, unknown>) => void;
  onFloatWindow?: (windowId: string, mousePosition?: { x: number; y: number }) => void;
  onRestoreWindow?: (windowId: string, insertIndex?: number) => void;
  onUpdateFloatingPosition?: (windowId: string, position: WindowPosition) => void;
  onFocusWindow?: (windowId: string) => void;
  onReorderWindows?: (fromIndex: number, toIndex: number) => void;
  emptyDescription?: React.ReactNode;
  floatingDefaults?: FloatingWindowDefaults;
}

export const WindowManager: React.FC<WindowManagerProps> = ({
  windows,
  activeWindowId,
  renderWindow,
  onSwitchWindow,
  onCloseWindow,
  onToggleMinimize,
  onBatchManage,
  onFloatWindow,
  onRestoreWindow,
  onUpdateFloatingPosition,
  onFocusWindow,
  onReorderWindows,
  emptyDescription = '从左侧菜单选择功能开始工作',
  floatingDefaults,
}) => {
  if (windows.length === 0) {
    return (
      <div className="rw-window-manager-empty">
        <EmptyState description={emptyDescription} />
      </div>
    );
  }

  const minimizedWindows = windows.filter((w) => w.minimized);
  const floatingWindows = windows.filter((w) => w.floating && !w.minimized);
  const normalWindows = windows.filter((w) => !w.minimized && !w.floating);

  return (
    <div className="rw-window-manager">
      <WindowTabs
        windows={normalWindows}
        activeWindowId={activeWindowId}
        onSwitchWindow={onSwitchWindow}
        onCloseWindow={onCloseWindow}
        onToggleMinimize={onToggleMinimize}
        onBatchManage={onBatchManage}
        onFloatWindow={onFloatWindow}
        onRestoreWindow={onRestoreWindow}
        onReorderWindows={onReorderWindows}
        allWindows={windows}
      />

      <div className="rw-window-content-area">
        {normalWindows.map((win) => (
          <WindowContainer key={win.id} window={win} active={win.id === activeWindowId}>
            {renderWindow(win, {} as WindowRenderContext)}
          </WindowContainer>
        ))}
      </div>

      {minimizedWindows.length > 0 && (
        <div className="rw-minimized-windows-bar">
          {minimizedWindows.map((win) => (
            <div
              key={win.id}
              className="rw-minimized-window-item"
              onClick={() => onToggleMinimize(win.id)}
              title={win.floating ? `${win.title} (浮动窗口)` : win.title}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onToggleMinimize(win.id)}
            >
              <span>{win.title}</span>
              {win.floating && <span className="rw-minimized-floating-badge">🔲</span>}
            </div>
          ))}
        </div>
      )}

      {floatingWindows.map((win) => (
        <FloatingWindow
          key={win.id}
          window={win}
          floatingDefaults={floatingDefaults}
          onUpdateFloatingPosition={onUpdateFloatingPosition || (() => {})}
          onRestoreWindow={onRestoreWindow || (() => {})}
          onCloseWindow={onCloseWindow}
          onToggleMinimize={onToggleMinimize}
          onFocusWindow={onFocusWindow}
        >
          {renderWindow(win, {} as WindowRenderContext)}
        </FloatingWindow>
      ))}
    </div>
  );
};

export default WindowManager;
