import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {DevDemoStackParamList} from '../demoNavigationTypes';
import {findTodoItemById} from './mock';

type Props = NativeStackScreenProps<DevDemoStackParamList, 'DevDemoTodoDetail'>;

export default function DemoTodoDetailScreen({route}: Props) {
  const item = useMemo(
    () => findTodoItemById(route.params.id),
    [route.params.id],
  );

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>未找到该待办事项</Text>
      </View>
    );
  }

  const rows: {label: string; value: string}[] = [
    {label: '标题', value: item.title},
    {label: '业务分类', value: item.category},
    {label: '状态', value: item.status},
    {label: '优先级', value: item.priority},
    {label: '来源', value: item.source},
    {label: '指派人', value: item.assignee},
    {label: '创建时间', value: item.createTime},
    {label: '截止日期', value: item.deadline},
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {rows.map(row => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
});
