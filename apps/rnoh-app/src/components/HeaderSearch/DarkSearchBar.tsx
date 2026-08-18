import React, {useCallback, useMemo} from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {SearchBar, Icon} from '@ant-design/react-native';
import {darkSearchBarThemeStyles} from './darkSearchBarStyles';

/** 与 darkSearchBarThemeStyles.cancelText.width 保持一致 */
const QUERY_BTN_WIDTH = 70;
/** 清除按钮与「查询」按钮之间的间距 */
const CLEAR_BTN_GAP = 10;

/** 发起查询时对关键词做首尾 trim（保留中间空格） */
export function trimSearchKeyword(value: string): string {
  return value.trim();
}

function applyQueryKeyword(
  value: string,
  onChange: (value: string) => void,
  onQuery: (value: string) => void,
) {
  const trimmed = trimSearchKeyword(value);
  if (trimmed !== value) {
    onChange(trimmed);
  }
  onQuery(trimmed);
}

export type DarkSearchBarProps = {
  value?: string;
  placeholder: string;
  placeholderTextColor?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * 深色顶栏搜索框。antd SearchBar 的 clearButtonMode 仅 iOS / 鸿蒙生效，
 * Android 需额外渲染清除按钮。点「查询」/ 键盘提交时自动 trim 首尾空格。
 */
export function DarkSearchBar({
  value,
  placeholder,
  placeholderTextColor = 'rgba(255,255,255,0.45)',
  onChange,
  onSubmit,
  onCancel,
  style,
}: DarkSearchBarProps) {
  const showAndroidClear =
    Platform.OS === 'android' && (value?.length ?? 0) > 0;

  const searchBarStyles = useMemo(
    () => ({
      ...darkSearchBarThemeStyles,
      input: {
        ...darkSearchBarThemeStyles.input,
        ...(showAndroidClear ? {paddingRight: 44} : null),
      },
    }),
    [showAndroidClear],
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleSubmit = useCallback(
    (text: string) => {
      applyQueryKeyword(text, onChange, onSubmit);
    },
    [onChange, onSubmit],
  );

  const handleCancel = useCallback(() => {
    applyQueryKeyword(value ?? '', onChange, onCancel);
  }, [value, onChange, onCancel]);

  return (
    <View style={[styles.wrap, style]}>
      <SearchBar
        value={value}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onChange={onChange}
        cancelText="查询"
        showCancelButton
        styles={searchBarStyles}
      />
      {showAndroidClear ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="清除搜索">
          <Icon name="close" size={16} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    position: 'relative',
  },
  clearBtn: {
    position: 'absolute',
    right: QUERY_BTN_WIDTH + CLEAR_BTN_GAP,
    top: 0,
    height: 50,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 4,
  },
});
