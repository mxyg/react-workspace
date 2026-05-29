import type { WindowPosition } from '../types';

const MIN_VISIBLE_SIZE = 100;

/** 检测并修复窗口位置，确保至少保留一个角落可见 */
export function fixWindowPosition(position: WindowPosition): WindowPosition {
  const viewportWidth = globalThis.window.innerWidth;
  const viewportHeight = globalThis.window.innerHeight;

  let newX = position.x;
  let newY = position.y;
  let needsFix = false;

  if (position.x + position.width < MIN_VISIBLE_SIZE) {
    newX = -position.width + MIN_VISIBLE_SIZE;
    needsFix = true;
  } else if (position.x > viewportWidth - MIN_VISIBLE_SIZE) {
    newX = viewportWidth - MIN_VISIBLE_SIZE;
    needsFix = true;
  }

  if (position.y < 0) {
    newY = 0;
    needsFix = true;
  } else if (position.y > viewportHeight - MIN_VISIBLE_SIZE) {
    newY = viewportHeight - MIN_VISIBLE_SIZE;
    needsFix = true;
  }

  if (needsFix) {
    return { x: newX, y: newY, width: position.width, height: position.height };
  }

  return position;
}

export interface WindowState {
  position?: WindowPosition;
  minimized?: boolean;
  floating?: boolean;
  floatingZIndex?: number;
}

export function getStorageKey(prefix: string, workspaceId: string): string {
  return `${prefix}${workspaceId}`;
}

export function getAllWindowStatesFromStorage(
  storageKeyPrefix: string,
  workspaceId: string,
): Record<string, WindowState> {
  if (!workspaceId) return {};
  try {
    const storageKey = getStorageKey(storageKeyPrefix, workspaceId);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const states = JSON.parse(stored);
      if (states && typeof states === 'object') {
        const fixedStates: Record<string, WindowState> = {};
        Object.entries(states).forEach(([windowType, state]) => {
          if (state && typeof state === 'object') {
            const windowState = state as WindowState;
            const fixedState: WindowState = {};

            if (
              windowState.position &&
              typeof windowState.position.x === 'number' &&
              typeof windowState.position.y === 'number' &&
              typeof windowState.position.width === 'number' &&
              typeof windowState.position.height === 'number'
            ) {
              fixedState.position = fixWindowPosition(windowState.position);
            }

            if (typeof windowState.minimized === 'boolean') {
              fixedState.minimized = windowState.minimized;
            }
            if (typeof windowState.floating === 'boolean') {
              fixedState.floating = windowState.floating;
            }
            if (typeof windowState.floatingZIndex === 'number') {
              fixedState.floatingZIndex = windowState.floatingZIndex;
            }

            fixedStates[windowType] = fixedState;
          }
        });
        return fixedStates;
      }
    }
  } catch (error) {
    console.warn('[react-workspace] 从 localStorage 读取窗口状态失败:', error);
  }
  return {};
}

export function saveWindowStateToStorage(
  storageKeyPrefix: string,
  workspaceId: string,
  windowType: string,
  state: WindowState,
): void {
  if (!workspaceId) return;
  try {
    const allStates = getAllWindowStatesFromStorage(storageKeyPrefix, workspaceId);
    allStates[windowType] = { ...allStates[windowType], ...state };
    localStorage.setItem(getStorageKey(storageKeyPrefix, workspaceId), JSON.stringify(allStates));
  } catch (error) {
    console.warn('[react-workspace] 保存窗口状态到 localStorage 失败:', error);
  }
}

export function updateTabClickOrder(
  storageKeyPrefix: string,
  workspaceId: string,
  windowType: string,
): void {
  if (!workspaceId) return;

  try {
    const storageKey = getStorageKey(storageKeyPrefix, workspaceId);
    const stored = localStorage.getItem(storageKey);
    let allStates: Record<string, WindowState> = stored ? JSON.parse(stored) : {};

    const allZIndexes = Object.values(allStates)
      .map((state) => state?.floatingZIndex || 0)
      .filter((zIndex) => zIndex >= 1000);
    const maxZIndex = allZIndexes.length > 0 ? Math.max(...allZIndexes) : 999;

    const currentState = allStates[windowType] || {};
    const currentZIndex = currentState.floatingZIndex || 0;
    const newZIndex = Math.max(1000, maxZIndex + 1);

    if (currentZIndex >= 1000) {
      allStates[windowType] = { ...currentState, floatingZIndex: newZIndex };
      Object.keys(allStates).forEach((type) => {
        if (type !== windowType && allStates[type]) {
          const state = allStates[type];
          if (state.floatingZIndex !== undefined && state.floatingZIndex >= 1000) {
            allStates[type] = {
              ...state,
              floatingZIndex: Math.max(1000, state.floatingZIndex - 1),
            };
          }
        }
      });
    } else {
      allStates[windowType] = { ...currentState, floatingZIndex: newZIndex };
    }

    localStorage.setItem(storageKey, JSON.stringify(allStates));
  } catch (error) {
    console.error('[react-workspace] 保存标签点击顺序失败:', error);
  }
}

/** 按点击顺序选择下一个激活窗口 */
export function pickNextActiveWindowId(
  windows: { id: string; type: string }[],
  storageKeyPrefix: string,
  workspaceId: string,
): string | null {
  if (windows.length === 0) return null;

  try {
    const stored = localStorage.getItem(getStorageKey(storageKeyPrefix, workspaceId));
    if (stored) {
      const allStates: Record<string, { floatingZIndex?: number }> = JSON.parse(stored);
      const sorted = [...windows].sort((a, b) => {
        const zIndexA = allStates[a.type]?.floatingZIndex || 0;
        const zIndexB = allStates[b.type]?.floatingZIndex || 0;
        if (zIndexA >= 1000 && zIndexB >= 1000) return zIndexB - zIndexA;
        if (zIndexA >= 1000) return -1;
        if (zIndexB >= 1000) return 1;
        return 0;
      });
      return sorted[0]?.id ?? windows[windows.length - 1].id;
    }
  } catch {
    // ignore
  }

  return windows[windows.length - 1].id;
}
