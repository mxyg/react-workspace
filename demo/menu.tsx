/**
 * 侧边栏菜单配置
 *
 * 每个菜单项通过 windowType 关联 windows 映射表中的面板组件。
 * 点击菜单 → 自动打开对应标签页。
 */
import type { SidebarMenuEntry } from '../src';
import {
  HomeOutlined,
  BookOutlined,
  SettingOutlined,
} from '@ant-design/icons';

export const menuItems: SidebarMenuEntry[] = [
  { key: 'home', icon: <HomeOutlined />, label: '首页', windowType: 'home' },
  { type: 'divider' },
  {
    key: 'docs',
    icon: <BookOutlined />,
    label: '文档',
    children: [
      { key: 'guide', label: '使用指南', windowType: 'guide' },
      { key: 'antd', label: 'Ant Design 集成', windowType: 'antd-guide' },
    ],
  },
  { key: 'settings', icon: <SettingOutlined />, label: '设置', windowType: 'settings' },
];
