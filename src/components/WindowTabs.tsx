/**
 * 窗口标签栏 - 无 antd 依赖，支持拖拽排序与拖出浮动
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Dropdown, type DropdownItem } from '../ui/Dropdown';
import { IconClose, IconMore } from '../ui/Icons';
import type { WindowConfig, BatchWindowAction } from '../types';
import '../styles/window-tabs.css';

export interface WindowTabsProps {
  windows: WindowConfig[];
  activeWindowId: string | null;
  onSwitchWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
  onToggleMinimize: (windowId: string) => void;
  onBatchManage: (action: BatchWindowAction) => void;
  onFloatWindow?: (windowId: string, mousePosition?: { x: number; y: number }) => void;
  onRestoreWindow?: (windowId: string, insertIndex?: number) => void;
  onReorderWindows?: (fromIndex: number, toIndex: number) => void;
  allWindows?: WindowConfig[];
}

export const WindowTabs: React.FC<WindowTabsProps> = ({
  windows,
  activeWindowId,
  onSwitchWindow,
  onCloseWindow,
  onToggleMinimize,
  onBatchManage,
  onFloatWindow,
  onRestoreWindow,
  onReorderWindows,
  allWindows = windows,
}) => {
  const activeIndex = windows.findIndex((w) => w.id === activeWindowId);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  const [reorderInsertIndex, setReorderInsertIndex] = useState<number | null>(null);
  const [floatPreview, setFloatPreview] = useState<{ title: string; index: number } | null>(null);

  const dragRef = useRef<{
    windowId: string;
    startX: number;
    startY: number;
    fromIndex: number;
    mode: 'none' | 'reorder' | 'float';
    floated: boolean;
  }>({ windowId: '', startX: 0, startY: 0, fromIndex: -1, mode: 'none', floated: false });

  const calcInsertIndex = useCallback((clientX: number): number => {
    const list = tabListRef.current;
    if (!list) return windows.length;
    const rect = list.getBoundingClientRect();
    const x = clientX - rect.left;
    const tabs = list.querySelectorAll('.rw-tab-item');
    if (x < 8) return 0;
    for (let i = 0; i < tabs.length; i++) {
      const tabRect = tabs[i].getBoundingClientRect();
      const center = tabRect.left - rect.left + tabRect.width / 2;
      if (x < center) return i;
    }
    return tabs.length;
  }, [windows.length]);

  const handleTabMouseDown = useCallback(
    (e: React.MouseEvent, windowId: string, index: number) => {
      if ((e.target as HTMLElement).closest('.rw-window-tab-close-btn')) return;
      if (e.button !== 0) return;

      dragRef.current = { windowId, startX: e.clientX, startY: e.clientY, fromIndex: index, mode: 'none', floated: false };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) return;

        if (dragRef.current.mode === 'none') {
          if (Math.abs(dy) > 40 && dist > 50) {
            dragRef.current.mode = 'float';
          } else if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
            dragRef.current.mode = 'reorder';
          } else if (dist > 50) {
            dragRef.current.mode = 'float';
          }
        }

        if (dragRef.current.mode === 'float' && dragRef.current.windowId === windowId) {
          if (!dragRef.current.floated) {
            dragRef.current.floated = true;
            onFloatWindow?.(windowId, { x: ev.clientX, y: ev.clientY });
          }
          // 不立即移除监听，等 mouseup 时由浮动窗口接管拖动
        } else if (dragRef.current.mode === 'reorder') {
          setReorderInsertIndex(calcInsertIndex(ev.clientX));
        }
      };

      const handleMouseUp = (ev: MouseEvent) => {
        if (dragRef.current.mode === 'reorder' && dragRef.current.windowId === windowId) {
          const toIndex = calcInsertIndex(ev.clientX);
          let target = toIndex;
          if (target > dragRef.current.fromIndex) target -= 1;
          if (target !== dragRef.current.fromIndex && onReorderWindows) {
            onReorderWindows(dragRef.current.fromIndex, target);
          }
        }
        setReorderInsertIndex(null);
        cleanup();
      };

      const cleanup = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        dragRef.current = { windowId: '', startX: 0, startY: 0, fromIndex: -1, mode: 'none', floated: false };
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onFloatWindow, onReorderWindows, calcInsertIndex],
  );

  // 浮动窗口拖回标签栏
  useEffect(() => {
    let rafId: number | null = null;

    const onFloatDrag = (e: Event) => {
      const { windowTitle, clientX } = (e as CustomEvent).detail;
      const insertIndex = calcInsertIndex(clientX);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setFloatPreview({ title: windowTitle, index: insertIndex });
        setReorderInsertIndex(insertIndex);
      });
    };

    const onClear = () => {
      setFloatPreview(null);
      setReorderInsertIndex(null);
    };

    const el = tabsContainerRef.current;
    el?.addEventListener('floatingWindowDragOver', onFloatDrag as EventListener);
    el?.addEventListener('clearFloatingWindowPreview', onClear);
    return () => {
      el?.removeEventListener('floatingWindowDragOver', onFloatDrag as EventListener);
      el?.removeEventListener('clearFloatingWindowPreview', onClear);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [calcInsertIndex]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const title = sessionStorage.getItem('draggingWindowTitle');
      if (title) setFloatPreview({ title, index: calcInsertIndex(e.clientX) });
    } catch { /* ignore */ }
    setReorderInsertIndex(calcInsertIndex(e.clientX));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    let windowId = e.dataTransfer.getData('windowId') || '';
    if (!windowId) {
      try { windowId = sessionStorage.getItem('draggingWindowId') || ''; } catch { /* ignore */ }
    }
    if (windowId && onRestoreWindow) {
      onRestoreWindow(windowId, reorderInsertIndex ?? undefined);
    }
    setFloatPreview(null);
    setReorderInsertIndex(null);
  };

  const batchItems: DropdownItem[] = [
    { key: 'close-others', label: '关闭其他', disabled: windows.length <= 1, onClick: () => onBatchManage('close-others') },
    { key: 'close-left', label: '关闭左侧', disabled: activeIndex <= 0, onClick: () => onBatchManage('close-left') },
    { key: 'close-right', label: '关闭右侧', disabled: activeIndex < 0 || activeIndex >= windows.length - 1, onClick: () => onBatchManage('close-right') },
    { key: 'd1', label: '', divider: true },
    { key: 'close-all', label: '关闭全部', disabled: !windows.length, onClick: () => onBatchManage('close-all') },
    { key: 'd2', label: '', divider: true },
    { key: 'minimize-all', label: '最小化全部', disabled: !windows.length, onClick: () => onBatchManage('minimize-all') },
    { key: 'restore-all', label: '还原全部', disabled: !allWindows.some((w) => w.minimized), onClick: () => onBatchManage('restore-all') },
    { key: 'd3', label: '', divider: true },
    { key: 'reset', label: '重置窗口', onClick: () => onBatchManage('reset-windows') },
  ];

  return (
    <div
      className="rw-window-tabs"
      ref={tabsContainerRef}
      onDragOver={handleDragOver}
      onDragLeave={() => { setFloatPreview(null); setReorderInsertIndex(null); }}
      onDrop={handleDrop}
    >
      <div className="rw-window-tabs-container">
        <div className="rw-tab-list" ref={tabListRef}>
          {windows.map((win, index) => (
            <div
              key={win.id}
              className={`rw-tab-item ${win.id === activeWindowId ? 'active' : ''}`}
              onClick={() => onSwitchWindow(win.id)}
              onMouseDown={(e) => handleTabMouseDown(e, win.id, index)}
            >
              <span className="rw-tab-title">{win.title}</span>
              <button
                type="button"
                title="关闭"
                className="rw-icon-btn rw-window-tab-close-btn"
                onClick={(e) => { e.stopPropagation(); onCloseWindow(win.id); }}
              >
                <IconClose size={12} />
              </button>
            </div>
          ))}
          {floatPreview && reorderInsertIndex !== null && (
            <div className="rw-tab-preview" style={{ order: reorderInsertIndex }}>
              {floatPreview.title}
            </div>
          )}
        </div>

        {reorderInsertIndex !== null && !floatPreview && (
          <ReorderIndicator listRef={tabListRef} index={reorderInsertIndex} />
        )}

        {windows.length > 0 && (
          <Dropdown
            items={batchItems}
            trigger={<button type="button" className="rw-icon-btn rw-window-tabs-batch-btn" title="批量管理"><IconMore /></button>}
          />
        )}
      </div>
    </div>
  );
};

const ReorderIndicator: React.FC<{
  listRef: React.RefObject<HTMLDivElement>;
  index: number;
}> = ({ listRef, index }) => {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const tabs = list.querySelectorAll('.rw-tab-item:not(.rw-tab-preview)');
      if (index === 0) { setLeft(8); return; }
      if (index >= tabs.length) {
        const last = tabs[tabs.length - 1] as HTMLElement;
        setLeft(last.offsetLeft + last.offsetWidth + 2);
        return;
      }
      const tab = tabs[index] as HTMLElement;
      setLeft(tab.offsetLeft - 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [listRef, index]);

  return <div className="rw-window-tab-insert-indicator" style={{ left: `${left}px` }} />;
};

export default WindowTabs;
