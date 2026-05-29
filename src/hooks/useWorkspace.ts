import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  WindowConfig,
  WindowPosition,
  DefaultWindowConfig,
  UseWorkspaceOptions,
  UseWorkspaceReturn,
  BatchWindowAction,
  FloatingWindowDefaults,
} from '../types';
import {
  fixWindowPosition,
  getAllWindowStatesFromStorage,
  saveWindowStateToStorage,
  updateTabClickOrder,
  pickNextActiveWindowId,
} from '../utils/windowStorage';

const DEFAULT_STORAGE_PREFIX = 'react_workspace_windows_';

const DEFAULT_FLOATING: Required<FloatingWindowDefaults> = {
  x: 100,
  y: 100,
  width: 800,
  height: 600,
  minWidth: 400,
  minHeight: 300,
};

function mergeFloatingDefaults(custom?: FloatingWindowDefaults): Required<FloatingWindowDefaults> {
  return { ...DEFAULT_FLOATING, ...custom };
}

function createWindowId(): string {
  return `window-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useWorkspace(options: UseWorkspaceOptions): UseWorkspaceReturn {
  const {
    workspaceId,
    defaultWindow: defaultWindowOption,
    syncToUrl = false,
    preserveUrlParams = true,
    searchParams,
    setSearchParams,
    storageKeyPrefix = DEFAULT_STORAGE_PREFIX,
    floatingDefaults: floatingDefaultsOption,
    onWindowsChange,
  } = options;

  const defaultWindowRef = useRef<DefaultWindowConfig>(
    defaultWindowOption ?? { type: 'home', title: '首页', minimized: false },
  );
  defaultWindowRef.current = defaultWindowOption ?? defaultWindowRef.current;

  const floatingDefaultsRef = useRef(mergeFloatingDefaults(floatingDefaultsOption));
  floatingDefaultsRef.current = mergeFloatingDefaults(floatingDefaultsOption);

  const onWindowsChangeRef = useRef(onWindowsChange);
  onWindowsChangeRef.current = onWindowsChange;

  const [windows, setWindows] = useState<WindowConfig[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<Record<string, boolean>>({});

  const notifyChange = useCallback((newWindows: WindowConfig[], newActiveId: string | null) => {
    onWindowsChangeRef.current?.(newWindows, newActiveId);
  }, []);

  const getWindowState = useCallback(
    (windowType: string) => getAllWindowStatesFromStorage(storageKeyPrefix, workspaceId)[windowType] || null,
    [storageKeyPrefix, workspaceId],
  );

  const getWindowPosition = useCallback(
    (windowType: string): WindowPosition | null => getWindowState(windowType)?.position || null,
    [getWindowState],
  );

  const saveWindowsToUrl = useCallback(
    (newWindows: WindowConfig[], newActiveId: string | null) => {
      if (!syncToUrl || !setSearchParams) return;
      const params = preserveUrlParams && searchParams
        ? new URLSearchParams(searchParams)
        : new URLSearchParams();

      if (newWindows.length > 0) {
        params.set('windows', encodeURIComponent(JSON.stringify(
          newWindows.map((w) => ({ id: w.id, type: w.type, title: w.title })),
        )));
      } else {
        params.delete('windows');
      }

      if (newActiveId) {
        params.set('active', newActiveId);
      } else {
        params.delete('active');
      }

      setSearchParams(params, { replace: true });
    },
    [syncToUrl, setSearchParams, preserveUrlParams, searchParams],
  );

  const applyState = useCallback(
    (newWindows: WindowConfig[], newActiveId: string | null) => {
      setWindows(newWindows);
      setActiveWindowId(newActiveId);
      saveWindowsToUrl(newWindows, newActiveId);
      notifyChange(newWindows, newActiveId);
    },
    [saveWindowsToUrl, notifyChange],
  );

  const restoreWindowState = useCallback(
    (w: WindowConfig): WindowConfig => {
      const storedState = getWindowState(w.type);
      const restored: WindowConfig = {
        ...w,
        minimized: storedState?.minimized ?? w.minimized ?? false,
        floating: storedState?.floating ?? w.floating ?? false,
      };

      if (restored.floating) {
        let finalPosition = w.floatingPosition || storedState?.position;
        if (!finalPosition) finalPosition = getWindowPosition(w.type) ?? undefined;
        if (finalPosition) restored.floatingPosition = fixWindowPosition(finalPosition);
        restored.floatingZIndex = storedState?.floatingZIndex ?? w.floatingZIndex ?? 1000;
      }

      return restored;
    },
    [getWindowState, getWindowPosition],
  );

  const openDefaultWindow = useCallback(() => {
    const def = defaultWindowRef.current;
    const win: WindowConfig = {
      id: createWindowId(),
      type: def.type,
      title: def.title,
      minimized: def.minimized ?? false,
    };
    applyState([win], win.id);
  }, [applyState]);

  const resetWorkspace = useCallback(() => {
    if (workspaceId) {
      try {
        localStorage.removeItem(`${storageKeyPrefix}${workspaceId}`);
      } catch { /* ignore */ }
    }
    setInitialized((prev) => {
      const next = { ...prev };
      delete next[workspaceId];
      return next;
    });
    openDefaultWindow();
  }, [workspaceId, storageKeyPrefix, openDefaultWindow]);

  // workspaceId 变化时重新初始化
  useEffect(() => {
    if (!workspaceId) return;
    if (initialized[workspaceId]) return;

    const windowsParam = syncToUrl ? searchParams?.get('windows') : null;
    const activeParam = syncToUrl ? searchParams?.get('active') : null;

    if (windowsParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(windowsParam)) as WindowConfig[];
        const withState = parsed.map(restoreWindowState);
        const activeId = activeParam && withState.some((w) => w.id === activeParam)
          ? activeParam
          : withState[0]?.id ?? null;
        setWindows(withState);
        setActiveWindowId(activeId);
        notifyChange(withState, activeId);
      } catch (error) {
        console.error('[react-workspace] 解析窗口配置失败:', error);
        openDefaultWindow();
      }
    } else {
      openDefaultWindow();
    }

    setInitialized((prev) => ({ ...prev, [workspaceId]: true }));
  }, [workspaceId, searchParams, syncToUrl, initialized, restoreWindowState, openDefaultWindow, notifyChange]);

  const openWindow = useCallback(
    (config: Omit<WindowConfig, 'id'>, props?: Record<string, unknown>) => {
      const mergedProps = props !== undefined ? { ...config.props, ...props } : config.props;
      const fullConfig = { ...config, props: mergedProps };
      const existing = windows.find((w) => w.type === fullConfig.type);

      if (existing) {
        const updatedProps = props && Object.keys(props).length === 0 ? undefined : mergedProps;
        const restored = restoreWindowState({ ...existing, ...fullConfig, props: updatedProps });
        const newWindows = windows.map((w) => (w.id === existing.id ? restored : w));
        applyState(newWindows, existing.id);
      } else {
        const newWindow = restoreWindowState({
          ...fullConfig,
          id: createWindowId(),
          minimized: fullConfig.minimized ?? false,
        });
        applyState([...windows, newWindow], newWindow.id);
      }
    },
    [windows, applyState, restoreWindowState],
  );

  const switchWindow = useCallback(
    (windowId: string) => {
      const target = windows.find((w) => w.id === windowId);
      if (!target) return;

      updateTabClickOrder(storageKeyPrefix, workspaceId, target.type);

      if (target.floating) {
        const storedState = getAllWindowStatesFromStorage(storageKeyPrefix, workspaceId)[target.type];
        if (storedState?.floatingZIndex) {
          const newWindows = windows.map((w) =>
            w.id === windowId ? { ...w, minimized: false, floatingZIndex: storedState.floatingZIndex } : w,
          );
          applyState(newWindows, windowId);
          return;
        }
      }

      applyState(
        windows.map((w) => (w.id === windowId ? { ...w, minimized: false } : w)),
        windowId,
      );
    },
    [windows, applyState, storageKeyPrefix, workspaceId],
  );

  const closeWindow = useCallback(
    (windowId: string) => {
      const newWindows = windows.filter((w) => w.id !== windowId);
      const newActiveId = activeWindowId === windowId
        ? pickNextActiveWindowId(newWindows, storageKeyPrefix, workspaceId)
        : activeWindowId;
      applyState(newWindows, newActiveId);
    },
    [windows, activeWindowId, applyState, storageKeyPrefix, workspaceId],
  );

  const toggleMinimize = useCallback(
    (windowId: string) => {
      const newWindows = windows.map((w) => {
        if (w.id === windowId) {
          const updated = { ...w, minimized: !w.minimized };
          saveWindowStateToStorage(storageKeyPrefix, workspaceId, w.type, {
            minimized: updated.minimized,
            floating: updated.floating,
          });
          return updated;
        }
        return w;
      });

      const target = newWindows.find((w) => w.id === windowId);
      if (target?.minimized && activeWindowId === windowId && !target.floating) {
        const firstNonMinimized = newWindows.find((w) => !w.minimized && !w.floating);
        applyState(newWindows, firstNonMinimized?.id ?? null);
      } else if (target && !target.minimized && !target.floating) {
        applyState(newWindows, windowId);
      } else {
        applyState(newWindows, activeWindowId);
      }
    },
    [windows, activeWindowId, workspaceId, storageKeyPrefix, applyState],
  );

  const floatWindow = useCallback(
    (windowId: string, mousePosition?: { x: number; y: number }) => {
      const target = windows.find((w) => w.id === windowId);
      if (!target || !workspaceId) return;
      if (target.floating) return;

      const normalWindows = windows.filter((w) => !w.floating && !w.minimized);
      if (normalWindows.length === 1 && normalWindows[0].id === windowId) return;

      const fd = floatingDefaultsRef.current;
      let initialPosition: WindowPosition = { x: fd.x, y: fd.y, width: fd.width, height: fd.height };

      if (mousePosition) {
        initialPosition = fixWindowPosition({
          x: mousePosition.x - fd.width / 2,
          y: Math.max(0, mousePosition.y - 40),
          width: fd.width,
          height: fd.height,
        });
      } else if (target.floatingPosition) {
        initialPosition = fixWindowPosition(target.floatingPosition);
      } else {
        const stored = getWindowPosition(target.type);
        if (stored) initialPosition = fixWindowPosition(stored);
      }

      updateTabClickOrder(storageKeyPrefix, workspaceId, target.type);
      const newZIndex = getAllWindowStatesFromStorage(storageKeyPrefix, workspaceId)[target.type]?.floatingZIndex ?? 1000;

      const newWindows = windows.map((w) => {
        if (w.id === windowId) {
          saveWindowStateToStorage(storageKeyPrefix, workspaceId, w.type, {
            floating: true,
            minimized: false,
            position: initialPosition,
            floatingZIndex: newZIndex,
          });
          return {
            ...w,
            floating: true,
            minimized: false,
            floatingPosition: initialPosition,
            floatingZIndex: newZIndex,
            pendingDragStart: mousePosition,
          };
        }
        return w;
      });

      if (activeWindowId === windowId) {
        const nonFloating = newWindows.filter((w) => !w.floating && !w.minimized);
        applyState(newWindows, nonFloating.length > 0
          ? pickNextActiveWindowId(nonFloating, storageKeyPrefix, workspaceId)
          : null);
      } else {
        applyState(newWindows, activeWindowId);
      }
    },
    [windows, activeWindowId, workspaceId, storageKeyPrefix, applyState, getWindowPosition],
  );

  const restoreWindow = useCallback(
    (windowId: string, insertIndex?: number) => {
      const target = windows.find((w) => w.id === windowId);
      if (!target?.floating) return;

      const { floating: _f, floatingPosition: _fp, floatingZIndex: _fz, pendingDragStart: _pd, ...rest } = target;

      saveWindowStateToStorage(storageKeyPrefix, workspaceId, target.type, {
        floating: false,
        minimized: rest.minimized,
      });

      const nonFloating = windows.filter((w) => !w.floating);
      let newWindows: WindowConfig[];

      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= nonFloating.length) {
        newWindows = [...nonFloating.slice(0, insertIndex), rest, ...nonFloating.slice(insertIndex)];
      } else {
        newWindows = [...nonFloating, rest];
      }

      newWindows = [...newWindows, ...windows.filter((w) => w.floating && w.id !== windowId)];
      applyState(newWindows, windowId);

      setTimeout(() => {
        document.querySelector('.rw-window-tabs')?.dispatchEvent(new CustomEvent('clearFloatingWindowPreview'));
      }, 0);
    },
    [windows, applyState, storageKeyPrefix, workspaceId],
  );

  const updateFloatingPosition = useCallback(
    (windowId: string, position: WindowPosition) => {
      const target = windows.find((w) => w.id === windowId);
      if (!target) return;

      const newWindows = windows.map((w) => {
        if (w.id === windowId) {
          const { pendingDragStart: _pd, ...rest } = w;
          return { ...rest, floatingPosition: position };
        }
        return w;
      });
      setWindows(newWindows);

      if (target.floating) {
        saveWindowStateToStorage(storageKeyPrefix, workspaceId, target.type, {
          position,
          floating: true,
          minimized: target.minimized,
          floatingZIndex: target.floatingZIndex,
        });
      }
    },
    [windows, workspaceId, storageKeyPrefix],
  );

  const focusWindow = useCallback(
    (windowId: string) => {
      const target = windows.find((w) => w.id === windowId);
      if (!target?.floating || !workspaceId) return;

      updateTabClickOrder(storageKeyPrefix, workspaceId, target.type);
      const storedState = getAllWindowStatesFromStorage(storageKeyPrefix, workspaceId)[target.type];

      if (storedState?.floatingZIndex) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === windowId && w.floating ? { ...w, floatingZIndex: storedState.floatingZIndex } : w,
          ),
        );
      }
    },
    [windows, workspaceId, storageKeyPrefix],
  );

  const updateWindowProps = useCallback(
    (windowId: string, props: Record<string, unknown>) => {
      setWindows((prev) => {
        const newWindows = prev.map((w) =>
          w.id === windowId ? { ...w, props: { ...w.props, ...props } } : w,
        );
        notifyChange(newWindows, activeWindowId);
        return newWindows;
      });
    },
    [activeWindowId, notifyChange],
  );

  const updateWindowTitle = useCallback(
    (windowId: string, title: string) => {
      setWindows((prev) => {
        const newWindows = prev.map((w) => (w.id === windowId ? { ...w, title } : w));
        saveWindowsToUrl(newWindows, activeWindowId);
        notifyChange(newWindows, activeWindowId);
        return newWindows;
      });
    },
    [activeWindowId, saveWindowsToUrl, notifyChange],
  );

  const clearPendingAction = useCallback(
    (windowId: string) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== windowId) return w;
          const { pendingAction: _pa, ...rest } = w;
          return rest;
        }),
      );
    },
    [],
  );

  const batchManage = useCallback(
    (action: BatchWindowAction) => {
      if (action === 'reset-windows') {
        resetWorkspace();
        return;
      }

      if (!activeWindowId && !['close-all', 'minimize-all', 'restore-all'].includes(action)) return;

      const nonFloating = windows.filter((w) => !w.floating);
      const floating = windows.filter((w) => w.floating);
      let newNonFloating: WindowConfig[] = [];
      let newActiveId: string | null = activeWindowId;

      switch (action) {
        case 'close-left': {
          const idx = nonFloating.findIndex((w) => w.id === activeWindowId);
          newNonFloating = nonFloating.slice(idx);
          break;
        }
        case 'close-right': {
          const idx = nonFloating.findIndex((w) => w.id === activeWindowId);
          newNonFloating = nonFloating.slice(0, idx + 1);
          break;
        }
        case 'close-others':
          newNonFloating = nonFloating.filter((w) => w.id === activeWindowId);
          break;
        case 'close-all':
          newNonFloating = [];
          newActiveId = null;
          break;
        case 'minimize-all':
          newNonFloating = nonFloating.map((w) => ({ ...w, minimized: true }));
          newActiveId = null;
          break;
        case 'restore-all':
          newNonFloating = nonFloating.map((w) => ({ ...w, minimized: false }));
          newActiveId = activeWindowId ?? newNonFloating[0]?.id ?? null;
          break;
        default:
          newNonFloating = nonFloating;
      }

      applyState([...newNonFloating, ...floating], newActiveId);
    },
    [windows, activeWindowId, applyState, resetWorkspace],
  );

  const reorderWindows = useCallback(
    (fromIndex: number, toIndex: number) => {
      const normal = windows.filter((w) => !w.minimized && !w.floating);
      if (fromIndex < 0 || fromIndex >= normal.length || toIndex < 0 || toIndex >= normal.length) return;
      if (fromIndex === toIndex) return;

      const reordered = [...normal];
      const [item] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, item);

      let ni = 0;
      const newWindows = windows.map((w) => {
        if (w.minimized || w.floating) return w;
        return reordered[ni++];
      });
      applyState(newWindows, activeWindowId);
    },
    [windows, activeWindowId, applyState],
  );

  return {
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
    updateWindowTitle,
    clearPendingAction,
    setWindows,
    setActiveWindowId,
    resetWorkspace,
    reorderWindows,
  };
}
