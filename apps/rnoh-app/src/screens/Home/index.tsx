import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import type {RootTabScreenProps} from '@/navigation/types';

type Props = RootTabScreenProps<'HomeTab'>;

export default function HomeScreen(_props: Props) {
  const {colors, spacing, typography} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Text style={[styles.title, typography.h1, {color: colors.text}]}>
        欢迎使用 RNOH Seed
      </Text>
      <Text
        style={[
          styles.subtitle,
          typography.body1,
          {color: colors.textSecondary, marginTop: spacing.sm},
        ]}>
        这是一套 React Native + OpenHarmony 三端脚手架。可在「我的 →
        功能演示」查看组件与导航示例。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 22,
  },
});
