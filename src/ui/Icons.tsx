import React from 'react';

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor' });

export const IconClose: React.FC<IconProps> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

export const IconMinus: React.FC<IconProps> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}><path d="M5 12h14" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

export const IconFloat: React.FC<IconProps> = ({ size = 14, className }) => (
  <svg {...base(size)} className={className}><rect x="5" y="5" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

export const IconMore: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...base(size)} className={className}><circle cx="6" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /></svg>
);

export const IconMenuFold: React.FC<IconProps> = ({ size = 12, className }) => (
  <svg {...base(size)} className={className}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

export const IconMenuUnfold: React.FC<IconProps> = ({ size = 12, className }) => (
  <svg {...base(size)} className={className}><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

export const IconFolder: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 7a2 2 0 012-2h5l2 2h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 12, className }) => (
  <svg {...base(size)} className={className}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);
