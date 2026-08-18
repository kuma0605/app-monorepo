import React from 'react';
import {TouchableOpacity, Text, StyleSheet, Alert} from 'react-native';
import type {PlatformButtonProps} from './types';

/**
 * HarmonyOS（鸿蒙）专属实现 - 无原生依赖版本
 */
export const PlatformButton: React.FC<PlatformButtonProps> = ({
  title,
  theme,
}) => {
  // 鸿蒙端特有的颜色：华为橙
  const bgColor = theme === 'primary' ? '#FF6F00' : '#999999';

  const handlePress = () => {
    // 使用标准的 Alert，但文字内容标明是鸿蒙环境
    Alert.alert('HarmonyOS 提示', `这是在鸿蒙设备上点击了：${title}`);
    console.log('HarmonyOS specific implementation triggered');
  };

  return (
    <TouchableOpacity
      style={[styles.btn, {backgroundColor: bgColor}]}
      onPress={handlePress}>
      <Text style={styles.txt}>{title} (Harmony)</Text>
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
  txt: {color: '#FFF', fontSize: 16},
});
