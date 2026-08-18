import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CommonActions} from '@react-navigation/native';
import {useTheme} from '@/hooks/useTheme';
import {
  emitSelectResultToPrevRoute,
  clearSelectResultsForOwner,
} from '@/hooks/useSelectBridge';
import type {DevDemoStackParamList} from './demoNavigationTypes';

type Props = NativeStackScreenProps<
  DevDemoStackParamList,
  'DevDemoNavCommSelect'
>;

const COMPANIES = [
  {id: '1', name: '腾讯科技 (Shenzhen)'},
  {id: '2', name: '阿里巴巴 (Hangzhou)'},
  {id: '3', name: '字节跳动 (Beijing)'},
  {id: '4', name: '百度集团 (Beijing)'},
  {id: '5', name: '华为终端 (Dongguan)'},
];

export default function DevDemoNavCommSelectDemoScreen({
  navigation,
  route,
}: Props) {
  const {colors, spacing, borderRadius, typography} = useTheme();
  const {mode} = route.params;

  const [isMemoryCleared, setIsMemoryCleared] = useState(false);

  const handleSelect = (company: (typeof COMPANIES)[number]) => {
    if (mode === 'official') {
      // Official Way: navigate back, updating parameter.
      const state = navigation.getState();
      const prevRoute = state.routes[state.routes.length - 2];
      if (prevRoute) {
        navigation.dispatch({
          ...CommonActions.setParams({selectedCompany: company}),
          source: prevRoute.key,
        });
      }
      navigation.goBack();
    } else {
      // Bridge Way: emit via useSelectBridge (route-keyed Map)
      const success = emitSelectResultToPrevRoute(navigation, company);
      if (success) {
        navigation.goBack();
      } else {
        // Callback failed (e.g., cleared due to simulated memory loss)
        Alert.alert(
          '回调失败',
          '由于 JS 内存状态丢失，之前注册的桥接回调函数已被销毁（变量为空）。直接返回将无法传递任何数据。',
          [
            {text: '取消', style: 'cancel'},
            {
              text: '直接返回',
              style: 'destructive',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    }
  };

  const handleSimulateMemoryLoss = () => {
    const state = navigation.getState();
    const prevRoute = state?.routes?.[state.routes.length - 2];
    if (prevRoute) {
      clearSelectResultsForOwner(prevRoute.key);
    }
    setIsMemoryCleared(true);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          padding: spacing.md,
        },
        headerCard: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        headerText: {
          ...typography.h3,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        badge: {
          alignSelf: 'flex-start',
          borderRadius: borderRadius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          marginBottom: spacing.sm,
        },
        badgeOfficial: {
          backgroundColor: '#0C68F2',
        },
        badgeBridge: {
          backgroundColor: '#00BFA5',
        },
        badgeText: {
          ...typography.caption,
          color: '#ffffff',
          fontWeight: 'bold',
        },
        listCard: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        itemRow: {
          padding: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        itemTitle: {
          ...typography.body1,
          color: colors.text,
          fontWeight: 'bold',
        },
        itemSub: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        arrowText: {
          color: colors.textSecondary,
          fontSize: 18,
        },
        btnSimulate: {
          marginTop: spacing.sm,
          borderColor: '#FF5252',
          borderWidth: 1,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.xs,
          alignItems: 'center',
        },
        btnSimulateText: {
          ...typography.body2,
          color: '#FF5252',
          fontWeight: 'bold',
        },
        simulateStatusText: {
          ...typography.caption,
          color: '#FF5252',
          marginTop: spacing.xs,
          fontStyle: 'italic',
          textAlign: 'center',
        },
      }),
    [colors, spacing, borderRadius, typography],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View
            style={[
              styles.badge,
              mode === 'official' ? styles.badgeOfficial : styles.badgeBridge,
            ]}>
            <Text style={styles.badgeText}>
              {mode === 'official'
                ? '官方 Params 路由模式'
                : 'useSelectBridge 路由键控模式'}
            </Text>
          </View>
          <Text style={styles.headerText}>请选择一家目标企业</Text>
          <Text style={{...typography.body2, color: colors.textSecondary}}>
            点击企业后，数据将以对应的通信方式回传至上一页。
          </Text>

          {mode === 'bridge' && (
            <View>
              <TouchableOpacity
                style={styles.btnSimulate}
                activeOpacity={0.8}
                onPress={handleSimulateMemoryLoss}>
                <Text style={styles.btnSimulateText}>
                  {isMemoryCleared ? '⚠️ 内存已被清空' : '模拟 JS 内存状态丢失'}
                </Text>
              </TouchableOpacity>
              {isMemoryCleared && (
                <Text style={styles.simulateStatusText}>
                  已清除内存中的回调函数引用！此时点击下方任何企业都会导致回调失败。
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.listCard}>
          {COMPANIES.map(company => (
            <TouchableOpacity
              key={company.id}
              style={styles.itemRow}
              activeOpacity={0.7}
              onPress={() => handleSelect(company)}>
              <View>
                <Text style={styles.itemTitle}>{company.name}</Text>
                <Text style={styles.itemSub}>
                  企业识别码: COMP_ID_{company.id}
                </Text>
              </View>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
