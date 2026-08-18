import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {useSelectBridge} from '@/hooks/useSelectBridge';
import type {DevDemoStackParamList} from './demoNavigationTypes';

type Props = NativeStackScreenProps<DevDemoStackParamList, 'DevDemoNavComm'>;

interface LogItem {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function DevDemoNavCommDemoScreen({navigation, route}: Props) {
  const {colors, spacing, borderRadius, typography} = useTheme();

  // 1. React Navigation Official State
  const [officialCompany, setOfficialCompany] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 2. useSelectBridge State
  const [bridgeCompany, setBridgeCompany] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 3. Demo Event Logs
  const [logs, setLogs] = useState<LogItem[]>([]);

  const addLog = (message: string, type: LogItem['type'] = 'info') => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs(prev => [
      {id: Math.random().toString(), time, message, type},
      ...prev.slice(0, 15), // Keep last 16 logs
    ]);
  };

  const {registerSelect} = useSelectBridge<{id: string; name: string}>();

  // --- Official Route Params Handler ---
  const selectedFromRoute = route.params?.selectedCompany;

  useEffect(() => {
    if (selectedFromRoute) {
      addLog(
        `[Official] route.params change detected: ${JSON.stringify(
          selectedFromRoute,
        )}`,
        'info',
      );

      // Consume the parameter
      setOfficialCompany(selectedFromRoute);
      addLog(`[Official] React state updated successfully!`, 'success');

      // Clear the parameter to avoid re-triggers when focus changes or returning from other pages
      navigation.setParams({selectedCompany: undefined});
      addLog(
        `[Official] Called setParams({selectedCompany: undefined}) to clean route params.`,
        'warning',
      );
    }
  }, [selectedFromRoute, navigation]);

  const handleSelectViaBridge = () => {
    addLog(
      '[Bridge] Registering callback via useSelectBridge: registerSelect(cb)',
      'info',
    );
    registerSelect((selectedCompany: {id: string; name: string}) => {
      addLog(
        `[Bridge] Callback fired in caller page! Payload: ${JSON.stringify(
          selectedCompany,
        )}`,
        'info',
      );
      setBridgeCompany(selectedCompany);
      addLog(`[Bridge] React state updated successfully!`, 'success');
    });

    addLog('[Bridge] Navigating to Selection screen...', 'info');
    navigation.navigate('DevDemoNavCommSelect', {mode: 'bridge'});
  };

  const handleSelectViaOfficial = () => {
    addLog(
      '[Official] Navigating to Selection screen without any local callback...',
      'info',
    );
    navigation.navigate('DevDemoNavCommSelect', {mode: 'official'});
  };

  // Simulate loss of memory (Hot Reload / Process Kill / Tab Reset)
  const handleSimulateMemoryLoss = () => {
    addLog(
      '[Simulate] useSelectBridge auto-cleans callbacks on unmount.',
      'info',
    );
    addLog(
      '[Simulate] 注：useSelectBridge 会在组件卸载时自动清理回调。如需测试手动内存丢失，请跳转到选择页后，点击选择页顶部的"模拟 JS 内存状态丢失"按钮。',
      'warning',
    );
  };

  const clearLogs = () => {
    setLogs([]);
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
          paddingBottom: spacing.xxl,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        cardTitle: {
          ...typography.h3,
          color: colors.text,
          marginBottom: spacing.xs,
        },
        cardSubtitle: {
          ...typography.body2,
          color: colors.textSecondary,
          marginBottom: spacing.md,
        },
        stateBox: {
          backgroundColor: colors.background,
          borderRadius: borderRadius.sm,
          padding: spacing.sm,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        stateLabel: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: spacing.xxs,
        },
        stateValue: {
          ...typography.body1,
          color: colors.text,
          fontWeight: 'bold',
        },
        btnOfficial: {
          backgroundColor: '#0C68F2',
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          alignItems: 'center',
        },
        btnBridge: {
          backgroundColor: '#00BFA5',
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          alignItems: 'center',
        },
        btnSimulate: {
          borderColor: '#FF5252',
          borderWidth: 1,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.sm,
          alignItems: 'center',
        },
        btnText: {
          ...typography.body1,
          color: '#ffffff',
          fontWeight: 'bold',
        },
        btnTextOutline: {
          ...typography.body1,
          color: '#FF5252',
          fontWeight: 'bold',
        },
        logTitleRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        btnClearText: {
          ...typography.body2,
          color: '#0C68F2',
        },
        terminal: {
          backgroundColor: '#1E1E1E',
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          minHeight: 180,
          maxHeight: 250,
        },
        logRow: {
          flexDirection: 'row',
          marginBottom: spacing.xxs,
        },
        logTime: {
          ...typography.caption,
          color: '#888',
          marginRight: spacing.sm,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        },
        logText: {
          ...typography.caption,
          flex: 1,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        },
        placeholderText: {
          color: '#888',
          fontStyle: 'italic',
        },
      }),
    [colors, spacing, borderRadius, typography],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Panel 1: React Navigation (Official route.params) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>方案 B：React Navigation 官方</Text>
          <Text style={styles.cardSubtitle}>
            利用路由树参数传递。结合 setParams
            置空防止副作用重复运行。支持热重载与后台销毁恢复。
          </Text>
          <View style={styles.stateBox}>
            <Text style={styles.stateLabel}>页面 State（官方）</Text>
            <Text style={styles.stateValue}>
              {officialCompany
                ? `${officialCompany.name} (ID: ${officialCompany.id})`
                : '未选择'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.btnOfficial}
            activeOpacity={0.8}
            onPress={handleSelectViaOfficial}>
            <Text style={styles.btnText}>通过官方 Params 方式选择</Text>
          </TouchableOpacity>
        </View>

        {/* Panel 2: useSelectBridge Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            方案 A：useSelectBridge 路由键控 Bridge
          </Text>
          <Text style={styles.cardSubtitle}>
            通过 useSelectBridge Hook 以 route.key
            为键注册回调，支持多路并发，组件卸载时自动清理。
          </Text>
          <View style={styles.stateBox}>
            <Text style={styles.stateLabel}>页面 State（Bridge）</Text>
            <Text style={styles.stateValue}>
              {bridgeCompany
                ? `${bridgeCompany.name} (ID: ${bridgeCompany.id})`
                : '未选择'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.btnBridge}
            activeOpacity={0.8}
            onPress={handleSelectViaBridge}>
            <Text style={styles.btnText}>通过 useSelectBridge 方式选择</Text>
          </TouchableOpacity>
        </View>

        {/* Panel 3: Simulation */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>崩溃/内存失效模拟</Text>
          <Text style={styles.cardSubtitle}>
            useSelectBridge 以 route.key
            为键存储回调（非单变量），天然支持多路并发选择流。测试内存丢失请跳转到【选择企业页】后点击顶部"模拟
            JS 内存状态丢失"按钮。
          </Text>
          <TouchableOpacity
            style={styles.btnSimulate}
            activeOpacity={0.8}
            onPress={handleSimulateMemoryLoss}>
            <Text style={styles.btnTextOutline}>查看测试指南</Text>
          </TouchableOpacity>
        </View>

        {/* Logs Terminal */}
        <View style={styles.card}>
          <View style={styles.logTitleRow}>
            <Text style={styles.cardTitle}>运行日志终端</Text>
            <TouchableOpacity onPress={clearLogs}>
              <Text style={styles.btnClearText}>清空日志</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.terminal} nestedScrollEnabled>
            {logs.length === 0 ? (
              <Text style={styles.placeholderText}>等待操作触发日志...</Text>
            ) : (
              logs.map(log => {
                let color = '#ccc';
                if (log.type === 'success') color = '#4CAF50';
                if (log.type === 'warning') color = '#FFC107';
                if (log.type === 'error') color = '#FF5252';
                return (
                  <View key={log.id} style={styles.logRow}>
                    <Text style={styles.logTime}>[{log.time}]</Text>
                    <Text style={[styles.logText, {color}]}>{log.message}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
