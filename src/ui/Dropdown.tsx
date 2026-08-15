import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../styles/ui.css';

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger: React.ReactNode;
  className?: string;
}

function themeClassOf(el: HTMLElement | null): string {
  let n: HTMLElement | null = el;
  while (n) {
    const hit = [...n.classList].find((c) => c.startsWith('rw-theme-'));
    if (hit) return hit;
    n = n.parentElement;
  }
  return '';
}

/**
 * 下拉菜单。
 *
 * 菜单必须 portal 到 document.body，不能画在触发器旁边。
 * 标签栏被宿主塞进顶栏之后，自己和一路祖先都是 overflow:hidden
 * （.rw-tabs-embedded、antd Header、整页外壳），绝对定位的菜单
 * 会被裁成一条缝 —— 和数、Argus 都撞过。挂到 body 上用 fixed
 * 对着触发器定位，谁裁都裁不到。
 */
export const Dropdown: React.FC<DropdownProps> = ({ items, trigger, className }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [themeClass, setThemeClass] = useState('');

  const place = useCallback(() => {
    const triggerEl = wrapRef.current?.querySelector('.rw-dropdown-trigger') as HTMLElement | null;
    const menu = menuRef.current;
    if (!triggerEl || !menu) return;
    const r = triggerEl.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const gap = 4;
    const pad = 8;
    let top = r.bottom + gap;
    if (top + mh > window.innerHeight - pad && r.top - gap - mh > pad) {
      top = r.top - gap - mh;
    }
    let left = r.right - mw;
    if (left < pad) left = pad;
    if (left + mw > window.innerWidth - pad) left = Math.max(pad, window.innerWidth - pad - mw);
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    setThemeClass(themeClassOf(wrapRef.current));
    place();
    window.addEventListener('resize', place);
    // 捕获阶段：标签栏横向滚、页面滚，都要跟着走。
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place, items.length]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`rw-dropdown ${className || ''}`} ref={wrapRef}>
      <div
        className="rw-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
      >
        {trigger}
      </div>
      {open && createPortal(
        <div
          ref={menuRef}
          className={`rw-dropdown-menu ${themeClass}`}
          style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden', top: 0, left: 0 }}
        >
          {items.map((item) =>
            item.divider ? (
              <div key={item.key} className="rw-dropdown-divider" />
            ) : (
              <button
                key={item.key}
                type="button"
                className="rw-dropdown-item"
                disabled={item.disabled}
                onClick={() => { item.onClick?.(); setOpen(false); }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};
