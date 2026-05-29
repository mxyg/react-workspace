import React, { useState, useRef, useEffect } from 'react';
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

export const Dropdown: React.FC<DropdownProps> = ({ items, trigger, className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className={`rw-dropdown ${className || ''}`} ref={ref}>
      <div className="rw-dropdown-trigger" onClick={() => setOpen((v) => !v)} role="button" tabIndex={0}>
        {trigger}
      </div>
      {open && (
        <div className="rw-dropdown-menu">
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
        </div>
      )}
    </div>
  );
};
