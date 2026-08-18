import React from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import type {PlatformButtonProps} from './types';
import {ToastAndroid} from 'react-native';

/**
 * Android 专属实现。
 * 使用 Android 原生 Toast 演示平台差异。
 */
export const PlatformButton: React.FC<PlatformButtonProps> = ({
  title,
  theme,
}) => {
  const bgColor = theme === 'primary' ? '#3DDC84' : '#AAAAAA';

  const handlePress = () => {
    ToastAndroid.show(`Android ${title}`, ToastAndroid.SHORT);
  };

  return (
    <TouchableOpacity
      style={[styles.btn, {backgroundColor: bgColor}]}
      onPress={handlePress}>
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
