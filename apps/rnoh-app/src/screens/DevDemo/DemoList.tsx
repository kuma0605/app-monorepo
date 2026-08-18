import React, {useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useTheme} from '@/hooks/useTheme';
import type {DevDemoId, DevDemoStackParamList} from './demoNavigationTypes';

type Props = NativeStackScreenProps<DevDemoStackParamList, 'DevDemoList'>;

type ListRow =
  | {
      key: string;
      kind: 'demo';
      demoId: DevDemoId;
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'detail';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'documentPicker';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'fileViewer';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'pullView';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'pullList';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'calendar';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'filePicker';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'todoList';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'formDemo';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'navComm';
      title: string;
      subtitle: string;
      emoji: string;
    }
  | {
      key: string;
      kind: 'echarts';
      title: string;
      subtitle: string;
      emoji: string;
    };

const ITEMS: ListRow[] = [
  {
    kind: 'demo',
    key: 'buttons',
    demoId: 'buttons',
    title: 'Button 组件示例',
    subtitle: 'TouchableOpacity、PlatformButton',
    emoji: '🧩',
  },
  {
    kind: 'demo',
    key: 'nativewind',
    demoId: 'nativewind',
    title: 'NativeWind 测试',
    subtitle: 'className 与 StyleSheet 混用',
    emoji: '🌊',
  },
  {
    kind: 'demo',
    key: 'reduxPersist',
    demoId: 'reduxPersist',
    title: '退出与计数',
    subtitle: 'Redux + redux-persist（AsyncStorage）',
    emoji: '💾',
  },
  {
    kind: 'demo',
    key: 'flashlist',
    demoId: 'flashlist',
    title: 'Flash List',
    subtitle: '@shopify/flash-list 列表示例',
    emoji: '⚡',
  },
  {
    kind: 'demo',
    key: 'permissions',
    demoId: 'permissions',
    title: '权限',
    subtitle: 'react-native-permissions 相机权限',
    emoji: '🔐',
  },
  {
    kind: 'demo',
    key: 'rnfs',
    demoId: 'rnfs',
    title: '文件系统',
    subtitle: 'react-native-fs 目录与文件读写',
    emoji: '📁',
  },
  {
    kind: 'detail',
    key: 'detail',
    title: '导航详情页（Detail）',
    subtitle: '路由参数 from / timestamp 示例',
    emoji: '📄',
  },
  {
    kind: 'documentPicker',
    key: 'documentPicker',
    title: '文件选择器',
    subtitle: 'react-native-document-picker',
    emoji: '📎',
  },
  {
    kind: 'fileViewer',
    key: 'fileViewer',
    title: '文件预览',
    subtitle: 'react-native-file-viewer',
    emoji: '👁️',
  },
  {
    kind: 'pullView',
    key: 'pullView',
    title: 'PullView 下拉刷新',
    subtitle: 'react-native-pull · ScrollView 包裹内容',
    emoji: '📥',
  },
  {
    kind: 'pullList',
    key: 'pullList',
    title: 'PullList 下拉刷新',
    subtitle: 'react-native-pull · 列表 + 上拉加载更多',
    emoji: '📃',
  },
  {
    kind: 'calendar',
    key: 'calendar',
    title: 'Calendar 日历',
    subtitle: '月/年视图 · dot 标记 · min/maxDate',
    emoji: '📅',
  },
  {
    kind: 'filePicker',
    key: 'filePicker',
    title: '文件选择器（选择+上传+预览）',
    subtitle: '选择单文件上传，压缩文件跳转浏览器下载',
    emoji: '📤',
  },
  {
    kind: 'todoList',
    key: 'todoList',
    title: '完整列表示例',
    subtitle: '待办提醒列表 · 搜索 + 多条件筛选 + 分页加载',
    emoji: '📋',
  },

  {
    kind: 'formDemo',
    key: 'formDemo',
    title: '表单综合示例',
    subtitle: '覆盖市场监管中各类表单数据录入场景',
    emoji: '📝',
  },
  {
    kind: 'navComm',
    key: 'navComm',
    title: '页面通信对比演示',
    subtitle: 'React Navigation 官方 vs useSelectBridge 路由键控 Bridge',
    emoji: '🔄',
  },
  {
    kind: 'echarts',
    key: 'echarts',
    title: 'ECharts 图表示例',
    subtitle: 'react-native-echarts-pro 饼图与柱状图/折线图',
    emoji: '📊',
  },
];

export default function DevDemoListScreen({navigation}: Props) {
  const {colors, spacing, borderRadius, typography} = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        },
        intro: {
          ...typography.body2,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        emoji: {
          fontSize: 28,
          marginRight: spacing.md,
        },
        title: {
          ...typography.h4,
          color: colors.text,
        },
        subtitle: {
          ...typography.body2,
          color: colors.textSecondary,
          marginTop: spacing.xs,
        },
      }),
    [colors, spacing, borderRadius, typography],
  );

  const onPressRow = (item: ListRow) => {
    if (item.kind === 'demo') {
      navigation.navigate('DevDemoDetail', {demoId: item.demoId});
      return;
    }
    if (item.kind === 'detail') {
      navigation.navigate('DevDemoDetailPage', {
        from: 'DevDemo',
        timestamp: Date.now(),
      });
      return;
    }
    if (item.kind === 'documentPicker') {
      navigation.navigate('DevDemoDocumentPicker');
      return;
    }
    if (item.kind === 'fileViewer') {
      navigation.navigate('DevDemoFileViewer');
      return;
    }
    if (item.kind === 'pullView') {
      navigation.navigate('DevDemoPullView');
      return;
    }
    if (item.kind === 'pullList') {
      navigation.navigate('DevDemoPullList');
      return;
    }
    if (item.kind === 'calendar') {
      navigation.navigate('DevDemoCalendar');
      return;
    }
    if (item.kind === 'filePicker') {
      navigation.navigate('DevDemoFilePicker');
      return;
    }
    if (item.kind === 'todoList') {
      navigation.navigate('DevDemoTodoList');
      return;
    }

    if (item.kind === 'formDemo') {
      navigation.navigate('DevDemoFormDemo');
      return;
    }
    if (item.kind === 'navComm') {
      navigation.navigate('DevDemoNavComm');
      return;
    }
    if (item.kind === 'echarts') {
      navigation.navigate('DevDemoECharts');
      return;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.intro}>
        以下为项目内功能演示，点击进入对应详情页或独立演示屏。
      </Text>
      {ITEMS.map(item => (
        <TouchableOpacity
          key={item.key}
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => onPressRow(item)}>
          <View style={styles.row}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={{flex: 1}}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            <Text style={{color: colors.textSecondary}}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
