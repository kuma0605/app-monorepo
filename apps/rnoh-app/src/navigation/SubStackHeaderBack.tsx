import React from 'react';
import {Platform, Pressable, StyleSheet, View} from 'react-native';
import {TouchableOpacity as GestureTouchableOpacity} from 'react-native-gesture-handler';
import {Icon} from '@ant-design/react-native';

type Props = {
  onPress: () => void;
};

const styles = StyleSheet.create({
  backWrap: {
    width: 56,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function BackIcon() {
  return (
    <View pointerEvents="none" style={styles.iconWrap}>
      <Icon name="left" color="white" size={22} />
    </View>
  );
}

/**
 * 返回按钮：
 * - 避免对 Icon 单独 rotate（视觉与 Pressable 命中区错位）
 * - Android Native Stack header：Fabric 真机上 RN Pressable/onPress 易丢事件（含鸿蒙 4.x 安装的安卓包），
 *   改用 RNGH TouchableOpacity + onPressOut（react-native-screens 已知问题 workaround）
 */
export function SubStackHeaderBack({onPress}: Props) {
  if (Platform.OS === 'android') {
    return (
      <GestureTouchableOpacity
        onPressOut={onPress}
        activeOpacity={0.6}
        style={styles.backWrap}
        accessibilityRole="button"
        accessibilityLabel="返回">
        <BackIcon />
      </GestureTouchableOpacity>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={styles.backWrap}
      accessibilityRole="button"
      accessibilityLabel="返回">
      <BackIcon />
    </Pressable>
  );
}
