import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import type {PlatformButtonProps} from './types';

/**
 * 默认（兜底）实现，仅用于调试或未匹配平台时的回退。
 * 这里不依赖任何平台特有的 API，只展示最基础的 UI。
 */
export const PlatformButton: React.FC<PlatformButtonProps> = ({
  title,
  theme,
}) => {
  const bgColor = theme === 'primary' ? '#0066FF' : '#CCCCCC';
  return (
    <TouchableOpacity style={[styles.btn, {backgroundColor: bgColor}]}>
      <Text style={styles.txt}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  txt: {
    color: '#FFF',
    fontSize: 16,
  },
});
