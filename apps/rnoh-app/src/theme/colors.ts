export const LightColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  border: '#C6C6C8',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  overlay: 'rgba(0,0,0,0.5)',
};

/** 子 Stack 导航栏与列表页深色顶栏（搜索 + DaDropdown）共用背景色 */
export const SUB_STACK_HEADER_BG = '#171933';

export const DarkColors: typeof LightColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  overlay: 'rgba(0,0,0,0.7)',
};

export type ColorScheme = typeof LightColors;
