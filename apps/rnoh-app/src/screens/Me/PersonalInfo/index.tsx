import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {useAppSelector} from '@/store/hooks';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, '/Me/PersonalInfo'>;

interface InfoRow {
  label: string;
  value: string;
}

export default function PersonalInfoScreen(_props: Props) {
  const {colors, spacing, typography, borderRadius} = useTheme();
  const profile = useAppSelector(state => state.user.profile);

  const rows: InfoRow[] = [
    {label: '姓名', value: profile?.name ?? '-'},
    {label: '账号', value: profile?.name ?? '-'},
  ];

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={{padding: spacing.md}}>
      <View
        style={[
          styles.card,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xl,
            borderRadius: borderRadius.md,
          },
        ]}>
        <View style={[styles.cardTitleRow, {marginBottom: spacing.md}]}>
          <View style={[styles.cardTitleAccent, {marginRight: spacing.sm}]} />
          <Text style={[typography.h4, {color: colors.text}]}>基本信息</Text>
        </View>
        <View
          style={[
            styles.divider,
            {backgroundColor: colors.border, marginBottom: spacing.lg},
          ]}
        />
        {rows.map(row => (
          <View
            key={row.label}
            style={[styles.row, {paddingVertical: spacing.sm + 2}]}>
            <Text style={[typography.body2, {color: colors.textSecondary}]}>
              {row.label}
            </Text>
            <Text style={[typography.body1, {color: colors.text}]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8EFF8',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleAccent: {
    width: 3,
    height: 16,
    backgroundColor: '#0C68F2',
    borderRadius: 1.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
