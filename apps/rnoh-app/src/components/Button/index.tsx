import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {useTheme} from '../../hooks/useTheme';

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** 按钮文字 */
  title: string;
  /** 点击回调 */
  onPress: () => void;
  /** 样式变体，默认 primary */
  variant?: ButtonVariant;
  /** 尺寸，默认 md */
  size?: ButtonSize;
  /** 禁用状态 */
  disabled?: boolean;
  /** 加载中状态（显示 spinner，禁止点击） */
  loading?: boolean;
  /** 自定义容器样式 */
  style?: StyleProp<ViewStyle>;
  /** 自定义文字样式 */
  textStyle?: StyleProp<TextStyle>;
}

// ─── 尺寸映射 ─────────────────────────────────────────────────────────────────

const SIZE_STYLES: Record<ButtonSize, ViewStyle> = {
  sm: {paddingHorizontal: 16, paddingVertical: 6, minHeight: 36},
  md: {paddingHorizontal: 24, paddingVertical: 12, minHeight: 48},
  lg: {paddingHorizontal: 32, paddingVertical: 16, minHeight: 56},
};

const TEXT_SIZE: Record<ButtonSize, number> = {
  sm: 14,
  md: 17,
  lg: 18,
};

// ─── 组件 ─────────────────────────────────────────────────────────────────────

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const {colors, borderRadius, typography} = useTheme();

  // 各 variant 的背景 / 边框样式
  const variantContainerStyle: Record<ButtonVariant, ViewStyle> = {
    primary: {backgroundColor: colors.primary},
    secondary: {backgroundColor: colors.secondary},
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ghost: {backgroundColor: 'transparent'},
  };

  // 各 variant 的文字颜色
  const variantTextColor: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: colors.primary,
    ghost: colors.primary,
  };

  const spinnerColor = variantTextColor[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        // 基础布局
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: borderRadius.md,
        },
        // 尺寸
        SIZE_STYLES[size],
        // 变体
        variantContainerStyle[variant],
        // 禁用
        (disabled || loading) && {opacity: 0.45},
        // 外部自定义
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text
          style={[
            typography.button,
            {
              color: variantTextColor[variant],
              fontSize: TEXT_SIZE[size],
            },
            textStyle,
          ]}
          numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
