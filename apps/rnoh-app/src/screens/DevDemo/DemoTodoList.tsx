import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {DevDemoStackParamList} from './demoNavigationTypes';
import {usePaginatedList} from '@/hooks/usePaginatedList';
import {useListRefreshOnFocus} from '@/hooks/useListRefreshOnFocus';
import {useScrollToTopFab} from '@/hooks/useScrollToTopFab';
import {useFilters} from '@/hooks/useFilters';
import {FilterListLayout, FilterSlotPanel} from '@/components/FilterListLayout';
import {type DropdownMenuItem} from '@/components/DaDropdown';
import {Picker} from '@ant-design/react-native';
import {
  MOCK_CATEGORIES,
  MOCK_PRIORITIES,
  MOCK_SOURCES,
  MOCK_STATUS_OPTIONS,
  mockFetchTodoList,
} from './demoTodoList/mock';
import type {TodoFilters, TodoItem} from './demoTodoList/types';
import {INITIAL_TODO_FILTERS} from './demoTodoList/types';

type Props = NativeStackScreenProps<DevDemoStackParamList, 'DevDemoTodoList'>;

const PRIORITY_COLOR: Record<string, {bg: string; text: string}> = {
  urgent: {bg: '#FFF0F0', text: '#E4393C'},
  important: {bg: '#FFF7E6', text: '#FA8C16'},
  normal: {bg: '#F0F9FF', text: '#0C68F2'},
};

const STATUS_COLOR: Record<string, {bg: string; text: string}> = {
  pending: {bg: '#FFF7E6', text: '#FA8C16'},
  processing: {bg: '#F0F9FF', text: '#0C68F2'},
  done: {bg: '#F0FFF0', text: '#52C41A'},
  rejected: {bg: '#FFF0F0', text: '#E4393C'},
};

export default function DemoTodoListScreen({navigation}: Props) {
  const {filters, filtersRef, updateFilter, resetFilters} =
    useFilters<TodoFilters>(INITIAL_TODO_FILTERS);

  const [priorityPickerVisible, setPriorityPickerVisible] = useState(false);
  const [sourcePickerVisible, setSourcePickerVisible] = useState(false);

  const initialMenu = useMemo<DropdownMenuItem[]>(
    () => [
      {
        title: '业务分类',
        type: 'filter',
        prop: 'category',
        options: [
          {
            type: 'checkbox',
            prop: 'ft1',
            options: MOCK_CATEGORIES,
          },
        ],
      },
      {
        title: '状态',
        type: 'filter',
        prop: 'status',
        options: [
          {
            type: 'radio',
            prop: 'ft1',
            options: MOCK_STATUS_OPTIONS,
          },
        ],
      },
      {
        title: '更多筛选',
        type: 'slot1',
        prop: 'more',
      },
    ],
    [],
  );

  const [menu, setMenu] = useState<DropdownMenuItem[]>(initialMenu);

  const fetcher = useCallback(
    (params: {pageNumber: number; pageSize: number}) =>
      mockFetchTodoList({
        ...params,
        keyword: filtersRef.current.keyword,
        category: filtersRef.current.category,
        status: filtersRef.current.status,
        priority: filtersRef.current.priority,
        source: filtersRef.current.source,
      }),
    [filtersRef],
  );

  const {
    data,
    loading,
    hasMoreThanOnePage,
    refreshing,
    loadingMore,
    hasMore,
    listRef,
    scrollToTop,
    refresh,
    refreshTouchedPage,
    onPullRefresh,
    loadMore,
    error,
    onItemPress,
  } = usePaginatedList<TodoItem>({
    fetcher,
    pageSize: 10,
    autoLoad: true,
  });

  const {scrollBind, scrollToTopFabVisible} = useScrollToTopFab({
    enabled: hasMoreThanOnePage,
  });

  const applyDropdownPayload = useCallback(
    (payload: Record<string, unknown>) => {
      if ('category' in payload) {
        const catPayload = payload.category as
          | Record<string, unknown>
          | undefined;
        if (catPayload && JSON.stringify(catPayload) !== '{}') {
          const selected = catPayload.ft1 as string[] | undefined;
          updateFilter('category', selected?.join(',') ?? '');
        } else {
          updateFilter('category', '');
        }
      }

      if ('status' in payload) {
        const statusPayload = payload.status as
          | Record<string, unknown>
          | undefined;
        if (statusPayload && JSON.stringify(statusPayload) !== '{}') {
          const selected = statusPayload.ft1 as string | undefined;
          updateFilter('status', selected ?? '');
        } else {
          updateFilter('status', '');
        }
      }
    },
    [updateFilter],
  );

  const onDropdownConfirm = useCallback(
    (payload: Record<string, unknown>) => {
      applyDropdownPayload(payload);
    },
    [applyDropdownPayload],
  );

  const onSearchSubmit = useCallback(
    (value: string) => {
      updateFilter('keyword', value);
      refresh();
    },
    [updateFilter, refresh],
  );

  const onSearchCancel = useCallback(
    (value: string) => {
      updateFilter('keyword', value);
      refresh();
    },
    [updateFilter, refresh],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      updateFilter('keyword', value);
      if (value.trim() === '') {
        refresh();
      }
    },
    [updateFilter, refresh],
  );

  const onResetAll = useCallback(() => {
    resetFilters();
    setMenu(initialMenu);
  }, [resetFilters, initialMenu]);

  useListRefreshOnFocus(refreshTouchedPage);

  useEffect(() => {
    const slotActive = !!(filters.priority || filters.source);
    setMenu(prev =>
      prev.map(item =>
        item.type === 'slot1' && item.prop === 'more'
          ? {...item, isActived: slotActive}
          : item,
      ),
    );
  }, [filters.priority, filters.source]);

  const prioritySelected = filters.priority != null && filters.priority !== '';
  const sourceSelected = filters.source != null && filters.source !== '';

  const priorityLabel = prioritySelected
    ? MOCK_PRIORITIES.find(p => p.value === filters.priority)?.label
    : '选择优先级';

  const sourceLabel = sourceSelected
    ? MOCK_SOURCES.find(s => s.value === filters.source)?.label
    : '选择来源';

  const renderSlot = useCallback(
    () => (
      <FilterSlotPanel
        fields={[
          {
            label: priorityLabel ?? '选择优先级',
            selected: prioritySelected,
            onPress: () => setPriorityPickerVisible(true),
          },
          {
            label: sourceLabel ?? '选择来源',
            selected: sourceSelected,
            onPress: () => setSourcePickerVisible(true),
          },
        ]}
        onReset={() => {
          updateFilter('priority', undefined);
          updateFilter('source', undefined);
        }}
        onResetAll={onResetAll}
        onQuery={refresh}
      />
    ),
    [
      priorityLabel,
      sourceLabel,
      prioritySelected,
      sourceSelected,
      updateFilter,
      refresh,
      onResetAll,
    ],
  );

  const renderItem = useCallback(
    ({item, index}: {item: TodoItem}) => {
      const pc = PRIORITY_COLOR[item.priorityCode] ?? PRIORITY_COLOR.normal;
      const sc = STATUS_COLOR[item.statusCode] ?? STATUS_COLOR.pending;

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => {
            onItemPress(index);
            navigation.navigate('DevDemoTodoDetail', {id: item.id});
          }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.tag, {backgroundColor: pc.bg}]}>
              <Text style={[styles.tagText, {color: pc.text}]}>
                {item.priority}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>业务分类：</Text>
              <Text style={styles.infoValue}>{item.category}</Text>
            </View>
            <View style={[styles.tag, {backgroundColor: sc.bg}]}>
              <Text style={[styles.tagText, {color: sc.text}]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>来源：</Text>
              <Text style={styles.infoValue}>{item.source}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>指派人：</Text>
              <Text style={styles.infoValue}>{item.assignee}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.clockIcon}>🕐</Text>
            <Text style={styles.footerLabel}>创建：</Text>
            <Text style={styles.footerTime}>{item.createTime}</Text>
            <Text style={styles.footerDivider}>|</Text>
            <Text style={styles.footerLabel}>截止：</Text>
            <Text style={styles.footerTime}>{item.deadline}</Text>
          </View>

          <View style={styles.divider} />
        </TouchableOpacity>
      );
    },
    [navigation, onItemPress],
  );

  return (
    <>
      <FilterListLayout
        search={{
          value: filters.keyword,
          placeholder: '请输入待办事项标题/指派人',
          onSubmit: onSearchSubmit,
          onCancel: onSearchCancel,
          onChange: onSearchChange,
        }}
        dropdown={{
          menu,
          onMenuChange: setMenu,
          onConfirm: onDropdownConfirm,
          renderSlot1: renderSlot,
        }}
        list={{
          data,
          loading,
          keyExtractor: item => item.id,
          renderItem,
          listRef,
          refreshing,
          loadingMore,
          hasMore,
          error,
          onRefresh: refresh,
          onPullRefresh,
          onLoadMore: loadMore,
          onScrollToTop: scrollToTop,
          scrollBind,
          scrollToTopFabVisible,
          emptyText: '暂无待办事项',
        }}
      />

      <Picker
        visible={priorityPickerVisible}
        data={MOCK_PRIORITIES}
        cols={1}
        onOk={val => {
          const v = val[0] as string;
          updateFilter('priority', v || undefined);
          setPriorityPickerVisible(false);
        }}
        onDismiss={() => setPriorityPickerVisible(false)}
      />

      <Picker
        visible={sourcePickerVisible}
        data={MOCK_SOURCES}
        cols={1}
        onOk={val => {
          const v = val[0] as string;
          updateFilter('source', v || undefined);
          setSourcePickerVisible(false);
        }}
        onDismiss={() => setSourcePickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 15,
    paddingHorizontal: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginRight: 8,
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  clockIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  footerLabel: {
    fontSize: 13,
    color: '#999',
  },
  footerTime: {
    fontSize: 13,
    color: '#666',
  },
  footerDivider: {
    marginHorizontal: 8,
    color: '#E0E0E0',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});
