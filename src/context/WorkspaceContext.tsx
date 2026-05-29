/**
 * Workspace Context - 在窗口内容中访问工作区 API
 */

import { createContext, useContext } from 'react';
import type { UseWorkspaceReturn, WindowConfig, WindowRenderContext } from '../types';

export interface WorkspaceContextValue extends UseWorkspaceReturn {
  workspaceId: string;
  /** 构建窗口渲染上下文 */
  buildRenderContext: (window: WindowConfig, active: boolean) => WindowRenderContext;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider = WorkspaceContext.Provider;

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('[react-workspace] useWorkspaceContext 必须在 Workspace 或 WorkspaceProvider 内使用');
  }
  return ctx;
}

/** 可选的 context hook，不在 Provider 内时返回 null */
export function useWorkspaceContextOptional(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}

export default WorkspaceContext;
