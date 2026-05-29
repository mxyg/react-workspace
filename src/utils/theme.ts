import type { CSSProperties } from 'react';

/** 可覆盖的 Workspace 主题变量（对应 CSS --rw-* 变量） */
export interface WorkspaceTheme {
  colorPrimary?: string;
  colorPrimaryHover?: string;
  colorPrimaryBg?: string;
  colorBg?: string;
  colorBgSecondary?: string;
  colorBgTertiary?: string;
  colorBgHover?: string;
  colorBgActive?: string;
  colorBorder?: string;
  colorBorderStrong?: string;
  colorText?: string;
  colorTextSecondary?: string;
  colorTextMuted?: string;
  sidebarWidth?: number;
  tabHeight?: number;
  radius?: number;
  fontSize?: number;
}

const VAR_MAP: Record<keyof WorkspaceTheme, string> = {
  colorPrimary: '--rw-color-primary',
  colorPrimaryHover: '--rw-color-primary-hover',
  colorPrimaryBg: '--rw-color-primary-bg',
  colorBg: '--rw-color-bg',
  colorBgSecondary: '--rw-color-bg-secondary',
  colorBgTertiary: '--rw-color-bg-tertiary',
  colorBgHover: '--rw-color-bg-hover',
  colorBgActive: '--rw-color-bg-active',
  colorBorder: '--rw-color-border',
  colorBorderStrong: '--rw-color-border-strong',
  colorText: '--rw-color-text',
  colorTextSecondary: '--rw-color-text-secondary',
  colorTextMuted: '--rw-color-text-muted',
  sidebarWidth: '--rw-sidebar-width',
  tabHeight: '--rw-tab-height',
  radius: '--rw-radius',
  fontSize: '--rw-font-size',
};

export function themeToCssVars(theme: WorkspaceTheme): CSSProperties {
  const style: Record<string, string> = {};
  (Object.keys(theme) as (keyof WorkspaceTheme)[]).forEach((key) => {
    const val = theme[key];
    if (val !== undefined) {
      const cssKey = VAR_MAP[key];
      style[cssKey] = typeof val === 'number' ? `${val}px` : val;
    }
  });
  return style as CSSProperties;
}

/** 将 Ant Design token 映射为 Workspace CSS 变量（无需在库内 import antd） */
export function mapAntdTokenToWorkspaceTheme(token: {
  colorPrimary?: string;
  colorPrimaryHover?: string;
  colorPrimaryBg?: string;
  colorBgContainer?: string;
  colorBgLayout?: string;
  colorBgTextHover?: string;
  colorFillAlter?: string;
  colorBorder?: string;
  colorBorderSecondary?: string;
  colorText?: string;
  colorTextSecondary?: string;
  colorTextTertiary?: string;
  borderRadius?: number;
  fontSize?: number;
}): WorkspaceTheme {
  return {
    colorPrimary: token.colorPrimary,
    colorPrimaryHover: token.colorPrimaryHover,
    colorPrimaryBg: token.colorPrimaryBg,
    colorBg: token.colorBgContainer,
    colorBgSecondary: token.colorFillAlter ?? token.colorBgContainer,
    colorBgTertiary: token.colorBgLayout,
    colorBgHover: token.colorBgTextHover,
    colorBgActive: token.colorPrimaryBg,
    colorBorder: token.colorBorder,
    colorBorderStrong: token.colorBorderSecondary ?? token.colorBorder,
    colorText: token.colorText,
    colorTextSecondary: token.colorTextSecondary,
    colorTextMuted: token.colorTextTertiary,
    radius: token.borderRadius,
    fontSize: token.fontSize,
  };
}

export function mapAntdTokenToCssVars(token: Parameters<typeof mapAntdTokenToWorkspaceTheme>[0]): CSSProperties {
  return themeToCssVars(mapAntdTokenToWorkspaceTheme(token));
}
