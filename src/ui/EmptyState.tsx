import React from 'react';
import { IconFolder } from './Icons';
import '../styles/ui.css';

export const EmptyState: React.FC<{ description?: React.ReactNode; icon?: React.ReactNode }> = ({
  description = '暂无内容',
  icon,
}) => (
  <div className="rw-empty">
    <div className="rw-empty-icon">{icon ?? <IconFolder size={64} />}</div>
    <div className="rw-empty-desc">{description}</div>
  </div>
);
