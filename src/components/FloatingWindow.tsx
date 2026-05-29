/**
 * 浮动窗口 - 无 antd 依赖
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IconClose, IconMinus, IconFloat } from '../ui/Icons';
import type { WindowConfig, WindowPosition, FloatingWindowDefaults } from '../types';
import { fixWindowPosition } from '../utils/windowStorage';
import '../styles/floating-window.css';

const DEFAULTS: Required<FloatingWindowDefaults> = {
  x: 100, y: 100, width: 800, height: 600, minWidth: 400, minHeight: 300,
};

export interface FloatingWindowProps {
  window: WindowConfig;
  children: React.ReactNode;
  floatingDefaults?: FloatingWindowDefaults;
  onUpdateFloatingPosition: (windowId: string, position: WindowPosition) => void;
  onRestoreWindow: (windowId: string, insertIndex?: number) => void;
  onCloseWindow: (windowId: string) => void;
  onToggleMinimize: (windowId: string) => void;
  onFocusWindow?: (windowId: string) => void;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
  window: win,
  children,
  floatingDefaults,
  onUpdateFloatingPosition,
  onRestoreWindow,
  onCloseWindow,
  onToggleMinimize,
  onFocusWindow,
}) => {
  const fd = { ...DEFAULTS, ...floatingDefaults };
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isOverTabsArea, setIsOverTabsArea] = useState(false);
  const wasOverTabsAreaRef = useRef(false);
  const resizeDirectionRef = useRef('');
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<WindowPosition | null>(null);
  const dragToRestoreRef = useRef<{ windowId: string; windowTitle: string } | null>(null);

  const position = win.floatingPosition || { x: fd.x, y: fd.y, width: fd.width, height: fd.height };

  // 从标签栏拖出时，鼠标仍按住 — 自动接续拖动
  useEffect(() => {
    if (!win.pendingDragStart || isDragging || isResizing) return;

    let currentX = position.x;
    let currentY = position.y;
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      currentX = rect.left;
      currentY = rect.top;
    }

    onFocusWindow?.(win.id);
    dragToRestoreRef.current = { windowId: win.id, windowTitle: win.title };
    try {
      sessionStorage.setItem('draggingWindowId', win.id);
      sessionStorage.setItem('draggingWindowTitle', win.title);
    } catch { /* ignore */ }

    setIsDragging(true);
    dragStartRef.current = {
      x: win.pendingDragStart.x - currentX,
      y: win.pendingDragStart.y - currentY,
      startX: currentX,
      startY: currentY,
      startWidth: position.width,
      startHeight: position.height,
    };
  }, [win.pendingDragStart, win.id, win.title, isDragging, isResizing, position, onFocusWindow]);

  useEffect(() => {
    if (isDragging || isResizing || win.pendingDragStart) return;
    const fitOptions = { minWidth: fd.minWidth, minHeight: fd.minHeight };
    const fixed = fixWindowPosition(position, fitOptions);
    if (
      fixed.x !== position.x
      || fixed.y !== position.y
      || fixed.width !== position.width
      || fixed.height !== position.height
    ) {
      onUpdateFloatingPosition(win.id, fixed);
    }
  }, [win.id, win.pendingDragStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!windowRef.current || isDragging || isResizing) return;
    const el = windowRef.current;
    el.style.transform = `translate(${position.x}px, ${position.y}px)`;
    el.style.width = `${position.width}px`;
    el.style.height = `${position.height}px`;
  }, [position.x, position.y, position.width, position.height, isDragging, isResizing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('.rw-floating-window-action-btn') || t.closest('.rw-floating-window-resize-handle')) return;
    if (!headerRef.current?.contains(t)) return;
    onFocusWindow?.(win.id);
    let cx = position.x, cy = position.y;
    if (windowRef.current) { const r = windowRef.current.getBoundingClientRect(); cx = r.left; cy = r.top; }
    dragToRestoreRef.current = { windowId: win.id, windowTitle: win.title };
    try { sessionStorage.setItem('draggingWindowId', win.id); sessionStorage.setItem('draggingWindowTitle', win.title); } catch { /* ignore */ }
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - cx, y: e.clientY - cy, startX: cx, startY: cy, startWidth: position.width, startHeight: position.height };
  }, [position, win.id, win.title, onFocusWindow]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, dir: string) => {
    e.stopPropagation(); e.preventDefault();
    onFocusWindow?.(win.id);
    let cx = position.x, cy = position.y, cw = position.width, ch = position.height;
    if (windowRef.current) { const r = windowRef.current.getBoundingClientRect(); cx = r.left; cy = r.top; cw = r.width; ch = r.height; }
    setIsResizing(true);
    resizeDirectionRef.current = dir;
    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: cw, height: ch, startX: cx, startY: cy };
  }, [position, win.id, onFocusWindow]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const tabs = document.querySelector('.rw-window-tabs');
        if (tabs && dragToRestoreRef.current) {
          const tr = tabs.getBoundingClientRect();
          const over = e.clientY >= tr.top && e.clientY <= tr.bottom && e.clientX >= tr.left && e.clientX <= tr.right;
          const was = wasOverTabsAreaRef.current;
          setIsOverTabsArea(over); wasOverTabsAreaRef.current = over;
          if (over) tabs.dispatchEvent(new CustomEvent('floatingWindowDragOver', { detail: { ...dragToRestoreRef.current, clientX: e.clientX, clientY: e.clientY } }));
          else if (was) tabs.dispatchEvent(new CustomEvent('clearFloatingWindowPreview'));
        }
        const w = dragStartRef.current.startWidth;
        const h = dragStartRef.current.startHeight;
        const nx = Math.max(0, Math.min(e.clientX - dragStartRef.current.x, globalThis.window.innerWidth - w));
        const ny = Math.max(0, Math.min(e.clientY - dragStartRef.current.y, globalThis.window.innerHeight - h));
        windowRef.current!.style.transform = `translate(${nx}px, ${ny}px)`;
        pendingPositionRef.current = { x: nx, y: ny, width: dragStartRef.current.startWidth, height: dragStartRef.current.startHeight };
      } else if (isResizing) {
        e.preventDefault();
        const d = resizeDirectionRef.current;
        const rs = resizeStartRef.current;
        let nx = rs.startX, ny = rs.startY, nw = rs.width, nh = rs.height;
        const dx = e.clientX - rs.x, dy = e.clientY - rs.y;
        if (d.includes('e')) nw = Math.max(fd.minWidth, rs.width + dx);
        if (d.includes('w')) { nw = Math.max(fd.minWidth, rs.width - dx); nx = rs.startX + rs.width - nw; }
        if (d.includes('s')) nh = Math.max(fd.minHeight, rs.height + dy);
        if (d.includes('n')) { nh = Math.max(fd.minHeight, rs.height - dy); ny = rs.startY + rs.height - nh; }
        const el = windowRef.current!;
        el.style.transform = `translate(${nx}px, ${ny}px)`;
        el.style.width = `${nw}px`; el.style.height = `${nh}px`;
        pendingPositionRef.current = { x: nx, y: ny, width: nw, height: nh };
      }
    };

    const onUp = (e?: MouseEvent) => {
      if (e && dragToRestoreRef.current) {
        const tabs = document.querySelector('.rw-window-tabs');
        if (tabs) {
          const tr = tabs.getBoundingClientRect();
          if (e.clientY >= tr.top && e.clientY <= tr.bottom && e.clientX >= tr.left && e.clientX <= tr.right) {
            const nav = tabs.querySelector('.rw-tab-list');
            if (nav) {
              let idx = nav.querySelectorAll('.rw-tab-item').length;
              const nr = nav.getBoundingClientRect();
              const x = e.clientX - nr.left;
              nav.querySelectorAll('.rw-tab-item').forEach((tab, i) => {
                const tb = tab.getBoundingClientRect();
                if (x < tb.left - nr.left + tb.width / 2) idx = Math.min(idx, i);
              });
              onRestoreWindow(dragToRestoreRef.current.windowId, idx);
              dragToRestoreRef.current = null;
              setIsDragging(false); setIsResizing(false); setIsOverTabsArea(false);
              return;
            }
          }
        }
      }
      let fp = pendingPositionRef.current;
      if (fp) {
        fp = fixWindowPosition(fp, { minWidth: fd.minWidth, minHeight: fd.minHeight });
      }
      if (fp) onUpdateFloatingPosition(win.id, fp);
      pendingPositionRef.current = null;
      dragToRestoreRef.current = null;
      try { sessionStorage.removeItem('draggingWindowId'); sessionStorage.removeItem('draggingWindowTitle'); } catch { /* ignore */ }
      setIsDragging(false); setIsResizing(false); setIsOverTabsArea(false);
      wasOverTabsAreaRef.current = false;
    };

    if (isDragging || isResizing) {
      const wrapped = (ev: MouseEvent) => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(() => onMove(ev)); };
      document.addEventListener('mousemove', wrapped, { passive: false });
      document.addEventListener('mouseup', onUp);
      document.body.style.userSelect = 'none';
      return () => { document.removeEventListener('mousemove', wrapped); document.removeEventListener('mouseup', onUp); document.body.style.userSelect = ''; };
    }
  }, [isDragging, isResizing, win.id, fd.minWidth, fd.minHeight, onUpdateFloatingPosition, onRestoreWindow]);

  return (
    <div
      ref={windowRef}
      className="rw-floating-window"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: position.width, height: position.height,
        zIndex: win.floatingZIndex || 1000,
        opacity: isOverTabsArea ? 0.5 : 1,
        minWidth: fd.minWidth, minHeight: fd.minHeight,
      }}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest('button, a, input, select, textarea')) return;
        onFocusWindow?.(win.id);
      }}
    >
      <div ref={headerRef} className="rw-floating-window-header" onMouseDown={handleMouseDown} onDoubleClick={() => onRestoreWindow(win.id)}>
        <div className="rw-floating-window-title">{win.title}</div>
        <div className="rw-floating-window-actions">
          <button type="button" title="放回" className="rw-icon-btn rw-floating-window-action-btn" onClick={() => onRestoreWindow(win.id)}><IconFloat size={12} /></button>
          <button type="button" title="最小化" className="rw-icon-btn rw-floating-window-action-btn" onClick={() => onToggleMinimize(win.id)}><IconMinus size={12} /></button>
          <button type="button" title="关闭" className="rw-icon-btn rw-floating-window-action-btn" onClick={() => onCloseWindow(win.id)}><IconClose size={12} /></button>
        </div>
      </div>
      <div className="rw-floating-window-content">{children}</div>
      {(['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'] as const).map((dir) => (
        <div key={dir} className={`rw-floating-window-resize-handle rw-floating-window-resize-${dir}`} onMouseDown={(e) => handleResizeMouseDown(e, dir)} />
      ))}
    </div>
  );
};

export default FloatingWindow;
