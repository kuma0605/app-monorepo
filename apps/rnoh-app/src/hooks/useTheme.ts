import {useColorScheme} from 'react-native';
import {
  LightColors,
  DarkColors,
  Spacing,
  BorderRadius,
  Typography,
} from '../theme';
import type {Theme} from '../theme';

/**
 * 读取系统深色/浅色模式，返回统一的 Theme 对象。
 *
 * @example
 * const { colors, spacing, isDark } = useTheme();
 * <View style={{ backgroundColor: colors.background }} />
 */
export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? DarkColors : LightColors,
    isDark,
    spacing: Spacing,
    borderRadius: BorderRadius,
    typography: Typography,
  };
}
