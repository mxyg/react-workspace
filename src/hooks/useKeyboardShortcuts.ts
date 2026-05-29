import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutsOptions {
  enabled?: boolean;
  windows: { id: string; minimized?: boolean; floating?: boolean }[];
  activeWindowId: string | null;
  onSwitchWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
}

/** IDE 快捷键：Ctrl/Cmd+W 关闭，Ctrl/Cmd+Tab 切换 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const { enabled = true, windows, activeWindowId, onSwitchWindow, onCloseWindow } = options;

  const getSwitchableWindows = useCallback(
    () => windows.filter((w) => !w.minimized && !w.floating),
    [windows],
  );

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;

      if (e.key === 'w' || e.key === 'W') {
        if (activeWindowId) {
          e.preventDefault();
          onCloseWindow(activeWindowId);
        }
        return;
      }

      if (e.key === 'Tab') {
        const list = getSwitchableWindows();
        if (list.length < 2) return;
        e.preventDefault();
        const idx = list.findIndex((w) => w.id === activeWindowId);
        const next = e.shiftKey
          ? list[(idx - 1 + list.length) % list.length]
          : list[(idx + 1) % list.length];
        if (next) onSwitchWindow(next.id);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, activeWindowId, getSwitchableWindows, onSwitchWindow, onCloseWindow]);
}
