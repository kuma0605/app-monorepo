import {useCallback, useEffect, useState, useRef} from 'react';
import {FlatList} from 'react-native';
import {useAppDispatch} from '@/store/hooks';
import {setLoading as setGlobalLoading} from '@/store/slices/globalSlice';

export type FetchType = 'refresh' | 'loadMore';

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

interface FetcherResponse<T> {
  code: number | string;
  data?: PaginatedResult<T>;
}

interface UsePaginatedListOptions<T> {
  fetcher: (params: {
    pageNumber: number;
    pageSize: number;
  }) => Promise<FetcherResponse<T>>;
  pageSize?: number;
  autoLoad?: boolean;
  isSuccess?: (res: FetcherResponse<T>) => boolean;
  skipSilentRefreshWithoutClick?: boolean;
  rowKey?: (item: T) => string | number;
}

export type PaginatedError<T> =
  | {type: 'exception'; error: unknown}
  | {type: 'business'; response: FetcherResponse<T>};

type RefreshOptions = {
  /** 静默刷新：不显示全局遮罩/下拉圈。配合 onItemPress 可局部刷新点击项所在页。 */
  silent?: boolean;
  /** 主动查询默认显示全局遮罩；必要时可显式关闭。 */
  useOverlay?: boolean;
};

type RefreshScope = 'firstPage' | 'touchedPage';

type RefreshIndicator = 'none' | 'pull' | 'overlay';

const defaultIsSuccess = <T>(res: FetcherResponse<T>) =>
  res.code === 200 || res.code === '200';

export function usePaginatedList<T>({
  fetcher,
  pageSize = 10,
  autoLoad = true,
  isSuccess = defaultIsSuccess,
  skipSilentRefreshWithoutClick = true,
  rowKey = (item: any) => item?.id ?? item?.comId ?? item?.code ?? item?.key,
}: UsePaginatedListOptions<T>) {
  const dispatch = useAppDispatch();
  const [data, setData] = useState<T[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const pageNumRef = useRef(1); // 用于解决闭包中的过期状态问题
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 下拉刷新 / 首次加载
  const [loading, setLoading] = useState(false); // 仅首次/数据为空加载时为 true
  const [loadingMore, setLoadingMore] = useState(false); // 上拉加载更多
  const [total, setTotal] = useState(0); // 总条数
  const [error, setError] = useState<PaginatedError<T> | null>(null); // 错误状态

  const isFetchingRef = useRef(false); // 同步锁，防止并发和重复请求
  const listRef = useRef<FlatList<T>>(null);
  const lastClickedIndexRef = useRef<number | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const isSuccessRef = useRef(isSuccess);
  isSuccessRef.current = isSuccess;
  const rowKeyRef = useRef(rowKey);
  rowKeyRef.current = rowKey;
  const dataRef = useRef<T[]>([]);
  dataRef.current = data;
  const isMountedRef = useRef(true);

  const onItemPress = useCallback((index: number) => {
    lastClickedIndexRef.current = index;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(
    async (
      page: number,
      type: FetchType,
      scope: RefreshScope = 'firstPage',
      indicator: RefreshIndicator = 'none',
    ) => {
      if (isFetchingRef.current) {
        return; // 如果正在请求中，直接忽略新的请求
      }
      isFetchingRef.current = true;

      setError(null);

      // 计算需要请求的页码。详情返回时精准刷新点击项所在页码
      let requestPage = 1;
      const shouldRefreshTouchedPage =
        type === 'refresh' && scope === 'touchedPage';
      if (shouldRefreshTouchedPage) {
        if (lastClickedIndexRef.current !== null) {
          requestPage = Math.floor(lastClickedIndexRef.current / pageSize) + 1;
        } else if (
          skipSilentRefreshWithoutClick &&
          dataRef.current.length > 0
        ) {
          // 如果是静默刷新，且没有点击过的索引记录，并且当前列表已有数据，则忽略本次刷新请求，以保留列表的完整状态和滚动位置
          isFetchingRef.current = false;
          return;
        }
      }

      // 加载指示器：
      // - 查询/筛选等主动刷新（refresh() 默认）显示全局遮罩
      // - 详情返回等点击页刷新由调用动作决定是否显示遮罩
      // - 首次加载（autoLoad）/空列表显示列表内中央菊花
      // - 下拉刷新走 RefreshControl，上拉加载更多走 footer
      if (type === 'refresh') {
        if (indicator === 'pull') {
          setRefreshing(true);
        } else if (indicator === 'overlay') {
          dispatch(setGlobalLoading(true));
        } else if (dataRef.current.length === 0) {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetcherRef.current({
          pageNumber: type === 'refresh' ? requestPage : page,
          pageSize,
        });
        if (!isMountedRef.current) {
          return;
        }
        if (isSuccessRef.current(res) && res.data) {
          const items = res.data.data ?? [];
          const hasReportedTotal =
            res.data.total !== undefined && res.data.total !== null;
          const totalCount = res.data.total ?? 0;

          let newData = dataRef.current;
          if (
            shouldRefreshTouchedPage &&
            lastClickedIndexRef.current !== null
          ) {
            // 安全防偏移校验：判断被点击项是否因为高并发新增/删除被挤出当前刷新的页面区间
            const clickedItem = dataRef.current[lastClickedIndexRef.current];
            const clickedItemKey = clickedItem
              ? rowKeyRef.current(clickedItem)
              : undefined;
            const isItemStillInFetchedPage =
              clickedItemKey !== undefined && clickedItemKey !== null
                ? items.some(
                    (item: any) => rowKeyRef.current(item) === clickedItemKey,
                  )
                : true;

            if (
              clickedItemKey !== undefined &&
              clickedItemKey !== null &&
              !isItemStillInFetchedPage
            ) {
              // 降级兜底：检测到严重偏移，释放锁并重新触发全列表 Page 1 刷新以纠正状态
              isFetchingRef.current = false;
              setTimeout(() => {
                fetchData(1, 'refresh', 'firstPage', indicator);
              }, 0);
              return;
            }

            // 整页替换对应页区间，避免接口返回不足一页时留下旧尾巴
            const startIndex = (requestPage - 1) * pageSize;
            newData = [
              ...dataRef.current.slice(0, startIndex),
              ...items,
              ...dataRef.current.slice(startIndex + pageSize),
            ];

            // 防御性去重：若局部刷新后发生数据向上挤压，过滤掉除新更新段以外的其他旧重复项
            const seenKeys = new Set();
            newData = newData.filter((item, idx) => {
              const itemKey = rowKeyRef.current(item);
              if (itemKey === undefined || itemKey === null || itemKey === '') {
                return true;
              }
              if (idx >= startIndex && idx < startIndex + items.length) {
                seenKeys.add(itemKey);
                return true;
              }
              if (seenKeys.has(itemKey)) {
                return false;
              }
              seenKeys.add(itemKey);
              return true;
            });
            if (hasReportedTotal) {
              newData = newData.slice(0, totalCount);
            }
          } else {
            newData =
              type === 'loadMore' ? [...dataRef.current, ...items] : items;
          }

          setData(newData);
          setHasMore(newData.length < totalCount);
          setTotal(totalCount);

          // 保持页数：点击页刷新不改变已加载页码，确保后续上拉继续接在当前列表后
          const targetPageNum = shouldRefreshTouchedPage
            ? pageNumRef.current
            : page;
          pageNumRef.current = targetPageNum;
          setPageNum(targetPageNum);
        } else {
          // 业务 code 不对，视为业务错误
          setError({type: 'business', response: res});
          // 失败时关闭 hasMore，避免空列表 onEndReached 反复触发 loadMore
          setHasMore(false);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError({type: 'exception', error: err});
          setHasMore(false);
        }
        if (__DEV__) {
          console.warn('[usePaginatedList] fetch error:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setRefreshing(false);
          setLoading(false);
          setLoadingMore(false);
        }
        if (indicator === 'overlay') {
          dispatch(setGlobalLoading(false));
        }
        // 延迟释放锁，避免 FlatList 在数据更新布局时自动触发 onEndReached
        // 刷新(refresh)时因为涉及布局稳定，采用 500ms 保护；加载更多(loadMore)只需 100ms
        const lockDelay = type === 'refresh' ? 500 : 100;
        setTimeout(() => {
          isFetchingRef.current = false; // 释放锁
          lastClickedIndexRef.current = null; // 释放锁后重置点击记录，保证事件连贯性
        }, lockDelay);
      }
    },
    [pageSize, skipSilentRefreshWithoutClick, dispatch],
  );

  const scrollToTop = useCallback((animated = true) => {
    listRef.current?.scrollToOffset({offset: 0, animated});
  }, []);

  const refresh = useCallback(
    // refresh() 用于查询/筛选等主动刷新，默认显示全局遮罩；
    // refresh({silent: true}) 用于详情返回/切回页面，保持静默。
    async (options?: RefreshOptions) => {
      const silent = options?.silent ?? false;
      const useOverlay = options?.useOverlay ?? !silent;
      if (!silent) {
        scrollToTop(false);
      }
      await fetchData(
        1,
        'refresh',
        silent ? 'touchedPage' : 'firstPage',
        useOverlay ? 'overlay' : 'none',
      );
    },
    [fetchData, scrollToTop],
  );

  const refreshFirstPageSilent = useCallback(async () => {
    await fetchData(1, 'refresh', 'firstPage', 'none');
  }, [fetchData]);

  const refreshTouchedPage = useCallback(async () => {
    await fetchData(1, 'refresh', 'touchedPage', 'overlay');
  }, [fetchData]);

  const onPullRefresh = useCallback(async () => {
    await fetchData(1, 'refresh', 'firstPage', 'pull');
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) {
      // 必须使用 pageNumRef 拿最新的页码，否则闭包会导致取到过期的旧页码（比如触发 second 页）
      fetchData(pageNumRef.current + 1, 'loadMore');
    }
  }, [hasMore, fetchData]);

  useEffect(() => {
    if (autoLoad) {
      // 首次自动加载不显示下拉菊花，只展示居中 loading
      fetchData(1, 'refresh');
    }
  }, [autoLoad, fetchData]);

  // 当前数据是否已超过一页：优先用接口 total，兜底用本地 data.length，
  // 兼容后端未返回准确 total 的场景。
  const hasMoreThanOnePage = total > pageSize || data.length > pageSize;

  return {
    data,
    total,
    pageSize,
    hasMoreThanOnePage,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    pageNum,
    error,
    listRef,
    scrollToTop,
    refresh,
    refreshFirstPageSilent,
    refreshTouchedPage,
    onPullRefresh,
    loadMore,
    onItemPress,
  };
}
