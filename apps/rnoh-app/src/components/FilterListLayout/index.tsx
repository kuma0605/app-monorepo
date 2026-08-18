import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  type ListRenderItem,
  type FlatListProps,
} from 'react-native';
import {
  DaDropdown,
  type DaDropdownProps,
  type DropdownMenuItem,
} from '@/components/DaDropdown';
import {DarkSearchBar} from '@/components/HeaderSearch/DarkSearchBar';
import {ListFooter, PaginatedListScrollToTopFab} from '@/components';
import type {PaginatedError} from '@/hooks/usePaginatedList';
import type {UseScrollToTopFabReturn} from '@/hooks/useScrollToTopFab';
import {SUB_STACK_HEADER_BG} from '@/theme/colors';

type FilterListSearchProps = {
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: (value: string) => void;
};

type FilterListDropdownProps = {
  menu: DropdownMenuItem[];
  onMenuChange: (menu: DropdownMenuItem[]) => void;
  onConfirm: (payload: Record<string, unknown>) => void;
  renderSlot1?: DaDropdownProps['renderSlot1'];
};

type FilterListBodyProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  listRef: React.RefObject<FlatList<T> | null>;
  loading?: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: PaginatedError<T> | null;
  /** 主动查询/筛选刷新，默认显示全局遮罩。 */
  onRefresh: () => void;
  /** 下拉刷新，显示 RefreshControl，不弹全局遮罩。 */
  onPullRefresh?: () => void;
  onLoadMore: () => void;
  onScrollToTop: () => void;
  scrollBind: UseScrollToTopFabReturn['scrollBind'];
  scrollToTopFabVisible: boolean;
  emptyText?: string;
  listProps?: Partial<
    Pick<
      FlatListProps<T>,
      | 'contentContainerStyle'
      | 'onEndReachedThreshold'
      | 'removeClippedSubviews'
    >
  >;
};

export type FilterListLayoutProps<T> = {
  search: FilterListSearchProps;
  dropdown: FilterListDropdownProps;
  list: FilterListBodyProps<T>;
};

function ListErrorState({onRetry}: {onRetry: () => void}) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>加载失败，请稍后重试</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>重试</Text>
      </TouchableOpacity>
    </View>
  );
}

function ListEmptyState({text}: {text: string}) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function FilterListLayout<T>({
  search,
  dropdown,
  list,
}: FilterListLayoutProps<T>) {
  const {
    data,
    keyExtractor,
    renderItem,
    listRef,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    onRefresh,
    onPullRefresh,
    onLoadMore,
    onScrollToTop,
    scrollBind,
    scrollToTopFabVisible,
    emptyText = '暂无数据',
    listProps,
  } = list;

  const showLoading = loading && data.length === 0;
  const showError = error != null && !refreshing && data.length === 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <DarkSearchBar
          value={search.value}
          placeholder={search.placeholder}
          onSubmit={search.onSubmit}
          onCancel={search.onCancel}
          onChange={search.onChange}
        />
        <DaDropdown
          dropdownMenu={dropdown.menu}
          onDropdownMenuChange={dropdown.onMenuChange}
          onConfirm={dropdown.onConfirm}
          onRefresh={onRefresh}
          renderSlot1={dropdown.renderSlot1}
        />
      </View>

      <View style={styles.body}>
        {showLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0C68F2" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            scrollToOverflowEnabled={true}
            alwaysBounceVertical={true}
            {...scrollBind}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onPullRefresh ?? onRefresh}
              />
            }
            onEndReached={() => {
              if (data.length > 0 && !refreshing && !loadingMore) {
                onLoadMore();
              }
            }}
            onEndReachedThreshold={listProps?.onEndReachedThreshold ?? 0.01}
            removeClippedSubviews={listProps?.removeClippedSubviews}
            ListFooterComponent={
              <ListFooter
                loadingMore={loadingMore}
                hasMore={hasMore}
                isEmpty={data.length === 0}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              listProps?.contentContainerStyle,
            ]}
            ListEmptyComponent={
              !refreshing ? (
                showError ? (
                  <ListErrorState onRetry={onRefresh} />
                ) : (
                  <ListEmptyState text={emptyText} />
                )
              ) : null
            }
          />
        )}
        <PaginatedListScrollToTopFab
          visible={scrollToTopFabVisible}
          onPress={onScrollToTop}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SUB_STACK_HEADER_BG,
  },
  header: {
    width: '100%',
    backgroundColor: SUB_STACK_HEADER_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontSize: 14,
  },
  errorContainer: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 6,
    backgroundColor: '#0C68F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});

export {FilterSlotPanel} from './FilterSlotPanel';
export type {FilterSlotField} from './FilterSlotPanel';
