import {useCallback, useRef, useState} from 'react';

export type ResetFiltersOptions = {
  /** 为 true 时埋下一次性重置信号，供 consumeResetSignal + refresh 使用 */
  refresh?: boolean;
};

/**
 * 列表筛选条件管理。
 * - filters: 当前筛选条件对象
 * - updateFilter(key, value): 更新单个字段（类型自动推导）
 * - setFilters: 整体替换（也支持 updater 函数）
 * - resetFilters(options?): 重置为初始值；默认不埋重置信号，需点「确定/查询」后再 refresh
 * - consumeResetSignal(): 消费一次重置信号（读取并清零），仅在 resetFilters({ refresh: true }) 后有效
 *
 * 典型用法（搭配 usePaginatedList）：
 *   const {filters, updateFilter, resetFilters, consumeResetSignal} =
 *     useFilters<Filters>(INITIAL_FILTERS);
 *
 *   const fetcher = useCallback(
 *     params => api({...params, ...filters}),
 *     [filters],
 *   );
 *
 *   const {refresh, ...} = usePaginatedList({fetcher});
 *
 *   // 仅在「重置后必须立刻 refresh」时使用：
 *   useEffect(() => {
 *     if (consumeResetSignal()) {
 *       refresh();
 *     }
 *   }, [filters, refresh, consumeResetSignal]);
 */
export function useFilters<T extends object>(initial: T) {
  const [filters, setFiltersState] = useState<T>(initial);
  const filtersRef = useRef<T>(initial);
  const initialRef = useRef(initial);

  // 一次性「重置信号」：resetFilters 时置 true，consumeResetSignal 读取后清零
  const resetSignalRef = useRef(false);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    filtersRef.current = {...filtersRef.current, [key]: value};
    setFiltersState(filtersRef.current);
  }, []);

  const setFilters = useCallback((next: T | ((prev: T) => T)) => {
    if (typeof next === 'function') {
      filtersRef.current = (next as (prev: T) => T)(filtersRef.current);
    } else {
      filtersRef.current = next;
    }
    setFiltersState(filtersRef.current);
  }, []);

  const resetFilters = useCallback((options?: ResetFiltersOptions) => {
    // 浅拷贝产生新引用，避免当前 filters 已等于 initial 时
    // setState 因引用相同而跳过重渲染、导致 resetSignal 无人消费
    const fresh = {...initialRef.current};
    filtersRef.current = fresh;
    setFiltersState(fresh);
    if (options?.refresh) {
      resetSignalRef.current = true;
    }
  }, []);

  const consumeResetSignal = useCallback(() => {
    if (resetSignalRef.current) {
      resetSignalRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    filters,
    filtersRef,
    setFilters,
    updateFilter,
    resetFilters,
    consumeResetSignal,
  };
}
