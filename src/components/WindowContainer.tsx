/**
 * 窗口容器 - 通用内容包装
 */

import React from 'react';
import type { WindowConfig } from '../types';
import '../styles/window-container.css';

export interface WindowContainerProps {
  window: WindowConfig;
  active: boolean;
  children: React.ReactNode;
}

export const WindowContainer: React.FC<WindowContainerProps> = ({ window: win, active, children }) => (
  <div
    className={`rw-window-container ${active ? 'active' : ''}`}
    style={{ display: active ? 'flex' : 'none', height: '100%', overflow: 'auto', flexDirection: 'column' }}
    data-window-type={win.type}
  >
    {children}
  </div>
);

export default WindowContainer;
