import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useTheme} from '@/hooks/useTheme';
import type {DevDemoStackParamList} from '../demoNavigationTypes';

type DevDemoDetailPageRoute = RouteProp<
  DevDemoStackParamList,
  'DevDemoDetailPage'
>;

type Props = {
  route: DevDemoDetailPageRoute;
  navigation: NativeStackNavigationProp<any>;
};

export default function DetailScreen({route}: Props) {
  const {colors, spacing, typography} = useTheme();
  const params = route.params;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    title: {...typography.h3, color: colors.text, marginBottom: spacing.md},
    text: {...typography.body1, color: colors.textSecondary},
    mono: {fontVariant: ['tabular-nums']},
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detail</Text>
      <Text style={styles.text}>
        from: <Text style={[styles.text, styles.mono]}>{params.from}</Text>
      </Text>
      <Text style={styles.text}>
        timestamp:{' '}
        <Text style={[styles.text, styles.mono]}>
          {String(params.timestamp)}
        </Text>
      </Text>
    </View>
  );
}
