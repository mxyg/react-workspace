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

/**
 * 解析 URL 里的窗口列表。新老两种格式都认：
 *   新：[{"t":"devices","n":"设备","p":{...}}]
 *   老：[{"id":"window-…","type":"devices","title":"设备"}]
 * 老格式的链接可能已经被人存成书签或者发出去了，不该在升级之后变成一片空白。
 */
function parseWindowsParam(raw: string): WindowConfig[] {
  // 老版本写进去的是 encodeURIComponent 过一次的 JSON，取出来还带着 %7B。
  let text = raw;
  if (text.trim().startsWith('%')) {
    try { text = decodeURIComponent(text); } catch { /* 解不开就按原样试 */ }
  }
  const list = JSON.parse(text) as Array<Record<string, unknown>>;
  if (!Array.isArray(list)) throw new Error('窗口列表不是数组');

  return list.map((raw0) => {
    const type = String(raw0.t ?? raw0.type ?? '');
    if (!type) throw new Error('窗口缺少类型');
    const w: WindowConfig = {
      id: typeof raw0.id === 'string' && raw0.id ? raw0.id : createWindowId(),
      type,
      title: String(raw0.n ?? raw0.title ?? type),
      minimized: false,
    };
    const props = (raw0.p ?? raw0.props) as Record<string, unknown> | undefined;
    if (props && typeof props === 'object') w.props = props;
    return w;
  });
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
  // 「这个工作区已经初始化过了」的哨兵。
  //
  // 必须是 ref 而不是 state：初始化 effect 依赖 searchParams，而开窗口会把窗口
  // 列表写回 URL，searchParams 随即换成新对象、effect 重跑。哨兵若存在 state 里，
  // 这次重跑可能赶在 setState 提交之前读到旧值，于是又执行一遍「打开默认窗口」，
  // 把用户刚点开的窗口顶掉 —— 表现就是点导航切不过去、自动弹回上一个窗口。
  // ref 的写入是同步的，同一轮里就能挡住第二次执行。
  const initializedRef = useRef<Record<string, boolean>>({});

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

  /**
   * 把窗口列表写进 URL。
   *
   * 格式刻意做得短而且能读懂 —— URL 就是这个工作区的状态，它会被复制、
   * 粘进聊天窗口、存成书签，太长或者满屏 %25 会让人不敢用：
   *
   *   ?windows=[{"t":"devices","n":"设备"},{"t":"member","n":"会员 #12","p":{"id":12}}]&active=1
   *
   *   t 窗口类型，n 标题，p 窗口参数（详情页的 id 之类，没有就不写）
   *   active 是**下标**，不是 id
   *
   * 三处和老格式不同，都是有理由的：
   *  · 不写 id。id 带时间戳，本质是本次会话的内部标识，写进 URL 只会让地址
   *    变长，还给人一种「这个链接绑定了某次会话」的错觉。恢复时重新生成即可。
   *  · 带上 p。老格式只存 id/type/title，详情类窗口恢复出来会丢掉参数
   *    （会员详情不知道自己该显示哪个会员）。
   *  · 不再 encodeURIComponent 一次再交给 URLSearchParams —— 那会把 %5B
   *    再编码成 %255B，地址长一倍且没人读得懂。URLSearchParams 自己会编码。
   */
  const saveWindowsToUrl = useCallback(
    (newWindows: WindowConfig[], newActiveId: string | null) => {
      if (!syncToUrl || !setSearchParams) return;
      const params = preserveUrlParams && searchParams
        ? new URLSearchParams(searchParams)
        : new URLSearchParams();

      if (newWindows.length > 0) {
        params.set('windows', JSON.stringify(newWindows.map((w) => {
          const item: { t: string; n: string; p?: Record<string, unknown> } = { t: w.type, n: w.title };
          if (w.props && Object.keys(w.props).length > 0) item.p = w.props;
          return item;
        })));
        const idx = newWindows.findIndex((w) => w.id === newActiveId);
        if (idx >= 0) params.set('active', String(idx));
        else params.delete('active');
      } else {
        params.delete('windows');
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
    delete initializedRef.current[workspaceId];
    openDefaultWindow();
  }, [workspaceId, storageKeyPrefix, openDefaultWindow]);

  // workspaceId 变化时重新初始化
  useEffect(() => {
    if (!workspaceId) return;
    if (initializedRef.current[workspaceId]) return;
    // 先立哨兵再干活：下面的 setState 会触发重渲染，effect 若重跑必须立刻被挡住。
    initializedRef.current[workspaceId] = true;

    const windowsParam = syncToUrl ? searchParams?.get('windows') : null;
    const activeParam = syncToUrl ? searchParams?.get('active') : null;

    if (windowsParam) {
      try {
        const parsed = parseWindowsParam(windowsParam);
        if (parsed.length === 0) throw new Error('窗口列表是空的');
        const withState = parsed.map(restoreWindowState);
        // active 是下标；老格式里它是窗口 id，两种都认。
        const byIndex = Number(activeParam);
        const activeId = Number.isInteger(byIndex) && byIndex >= 0 && byIndex < withState.length
          ? withState[byIndex].id
          : withState.find((w) => w.id === activeParam)?.id ?? withState[0]?.id ?? null;
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

  }, [workspaceId, searchParams, syncToUrl, restoreWindowState, openDefaultWindow, notifyChange]);

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
      const fitOptions = { minWidth: fd.minWidth, minHeight: fd.minHeight };
      let initialPosition: WindowPosition = fixWindowPosition(
        { x: fd.x, y: fd.y, width: fd.width, height: fd.height },
        fitOptions,
      );

      if (mousePosition) {
        // 从标签页拖出来时，窗口左上角就落在鼠标位置。
        //
        // 原来是「水平居中于光标、再往上抬 40px」，于是窗口会在脱离标签栏的瞬间
        // 往左上跳一截，接着拖动又按「光标相对窗口的偏移」接管，视觉上是抖一下。
        // 左上角对齐光标之后那个偏移正好是 (0,0)，拖出和拖动是连贯的一个动作。
        initialPosition = fixWindowPosition({
          x: mousePosition.x,
          y: mousePosition.y,
          width: fd.width,
          height: fd.height,
        }, fitOptions);
      } else if (target.floatingPosition) {
        initialPosition = fixWindowPosition(target.floatingPosition, fitOptions);
      } else {
        const stored = getWindowPosition(target.type);
        if (stored) initialPosition = fixWindowPosition(stored, fitOptions);
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
