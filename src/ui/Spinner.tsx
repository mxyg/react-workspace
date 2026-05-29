import React from 'react';
import '../styles/ui.css';

export const Spinner: React.FC<{ tip?: string; spinning?: boolean; children?: React.ReactNode }> = ({
  tip = '加载中...',
  spinning = false,
  children,
}) => (
  <div className="rw-spinner-wrap">
    {children}
    {spinning && (
      <div className="rw-spinner-overlay">
        <div className="rw-spinner" />
        {tip && <span className="rw-spinner-tip">{tip}</span>}
      </div>
    )}
  </div>
);
