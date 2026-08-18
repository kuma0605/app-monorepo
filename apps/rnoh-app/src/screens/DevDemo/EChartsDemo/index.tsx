import React, {useState, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import RNEChartsPro from 'react-native-echarts-pro';
import {useTheme} from '@/hooks/useTheme';

export default function EChartsDemo() {
  const {colors, isDark, spacing, borderRadius, typography} = useTheme();
  const [activeTab, setActiveTab] = useState<'pie' | 'barLine'>('pie');

  // State for chart data to allow randomization
  const [pieData, setPieData] = useState([
    {value: 120, name: 'Android'},
    {value: 320, name: 'iOS'},
    {value: 240, name: 'Web'},
    {value: 180, name: 'HarmonyOS'},
  ]);

  const [barData, setBarData] = useState([15, 22, 18, 30, 45]);
  const [lineData, setLineData] = useState([12, 19, 15, 25, 32]);

  // Handler to randomize chart data
  const handleRandomize = () => {
    if (activeTab === 'pie') {
      setPieData(prev =>
        prev.map(item => ({
          ...item,
          value: Math.floor(Math.random() * 400) + 50,
        })),
      );
    } else {
      setBarData(prev => prev.map(() => Math.floor(Math.random() * 50) + 10));
      setLineData(prev => prev.map(() => Math.floor(Math.random() * 50) + 10));
    }
  };

  // Memoized options to avoid unnecessary recreations and handle themes
  const pieOption = useMemo(() => {
    return {
      title: {
        text: '设备操作系统分布数据',
        subtext: '实时模拟数据',
        left: 'center',
        textStyle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: 'bold',
        },
        subtextStyle: {
          color: colors.textSecondary,
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: {
          color: colors.textSecondary,
        },
      },
      series: [
        {
          name: '设备系统',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: isDark ? '#1a1a1a' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: colors.text,
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
        },
      ],
    };
  }, [pieData, colors, isDark]);

  const barLineOption = useMemo(() => {
    return {
      title: {
        text: '季度产品出货与增长率',
        left: 'center',
        textStyle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['出货量', '增长率'],
        bottom: '0%',
        textStyle: {
          color: colors.textSecondary,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
          axisLabel: {
            color: colors.textSecondary,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            color: colors.textSecondary,
          },
          splitLine: {
            lineStyle: {
              color: isDark ? '#333333' : '#e5e5e5',
            },
          },
        },
      ],
      series: [
        {
          name: '出货量',
          type: 'bar',
          emphasis: {
            focus: 'series',
          },
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
          data: barData,
        },
        {
          name: '增长率',
          type: 'line',
          smooth: true,
          data: lineData,
        },
      ],
    };
  }, [barData, lineData, colors, isDark]);

  // Styles creation
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text,
    },
    headerSub: {
      ...typography.body2,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    tabContainer: {
      flexDirection: 'row',
      padding: spacing.sm,
      justifyContent: 'center',
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTabButton: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...typography.body1,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    chartCard: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chartContainer: {
      height: 320,
      justifyContent: 'center',
    },
    btnContainer: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      ...typography.button,
      color: '#FFFFFF',
    },
    infoCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.xl,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    infoTitle: {
      ...typography.h4,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    infoText: {
      ...typography.body2,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Apache ECharts 示例</Text>
          <Text style={styles.headerSub}>
            基于 react-native-echarts-pro 原生 WebView 渲染
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'pie' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('pie')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'pie' && styles.activeTabText,
              ]}>
              环形饼图
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'barLine' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('barLine')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'barLine' && styles.activeTabText,
              ]}>
              折柱混合图
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {activeTab === 'pie' ? (
              <RNEChartsPro
                height={300}
                option={pieOption}
                themeName={isDark ? 'dark' : 'macarons'}
              />
            ) : (
              <RNEChartsPro
                height={300}
                option={barLineOption}
                themeName={isDark ? 'dark' : 'macarons'}
              />
            )}
          </View>
        </View>

        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRandomize}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>随机更新图表数据</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>兼容性与原理说明</Text>
          <Text style={styles.infoText}>
            • 本组件在 HarmonyOS 上依赖 @react-native-ohos/react-native-webview
            的原生侧能力渲染。{'\n'}• 能够完美融合系统的主题风格。当前系统处于：
            {isDark ? '深色模式 (Dark Mode)' : '浅色模式 (Light Mode)'}。{'\n'}•
            图表完全支持手势缩放、点击气泡提示（Tooltip）以及图例切换等原生的
            ECharts 交互体验。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
