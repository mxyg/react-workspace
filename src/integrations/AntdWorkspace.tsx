/**
 * Ant Design 开箱即用工作区
 *
 * 内置 ConfigProvider、侧边栏、主题同步，最少配置即可运行：
 *
 * ```tsx
 * import { AntdWorkspace } from '@liuman/react-workspace/antd';
 * import '@liuman/react-workspace/style.css';
 *
 * <AntdWorkspace menuItems={menuItems} windows={{ home: HomePage }} />
 * ```
 */

import React, { useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';
import { Workspace } from '../components/Workspace';
import { AntdWorkspaceSidebar } from './AntdSidebar';
import { mapAntdTokenToWorkspaceTheme } from '../utils/theme';
import type { WorkspaceProps } from '../types';

export interface AntdWorkspaceProps extends Omit<WorkspaceProps, 'renderSidebar' | 'theme' | 'themeClassName'> {
  /** 是否启用暗色模式 */
  dark?: boolean;
  /** 侧边栏主题，默认跟随 dark */
  sidebarTheme?: 'light' | 'dark';
  /** 透传给 antd ConfigProvider 的 theme 配置 */
  antdTheme?: ThemeConfig;
}

function WorkspaceBody({
  dark = false,
  sidebarTheme,
  ...workspaceProps
}: AntdWorkspaceProps) {
  const { token } = antdTheme.useToken();
  const workspaceTheme = useMemo(() => mapAntdTokenToWorkspaceTheme(token), [token]);
  const siderTheme = sidebarTheme ?? (dark ? 'dark' : 'light');

  return (
    <Workspace
      {...workspaceProps}
      theme={workspaceTheme}
      themeClassName={dark ? 'rw-theme-dark' : undefined}
      renderSidebar={(props) => (
        <AntdWorkspaceSidebar {...props} theme={siderTheme} />
      )}
    />
  );
}

export const AntdWorkspace: React.FC<AntdWorkspaceProps> = ({
  dark = false,
  sidebarTheme,
  antdTheme: antdThemeConfig,
  ...workspaceProps
}) => (
  <ConfigProvider
    theme={{
      algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      ...antdThemeConfig,
    }}
  >
    <WorkspaceBody dark={dark} sidebarTheme={sidebarTheme} {...workspaceProps} />
  </ConfigProvider>
);

export default AntdWorkspace;
