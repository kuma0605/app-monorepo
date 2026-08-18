/* eslint-disable no-void */
import {useCallback, useRef} from 'react';
import {useFocusEffect} from '@react-navigation/native';

/**
 * 列表页配合 `usePaginatedList({ autoLoad: true })` 使用：
 * - 首次进入：由 autoLoad 拉首屏，本 hook 不重复 refresh
 * - 从详情/操作页返回：执行传入的刷新动作
 */
export function useListRefreshOnFocus(
  refreshOnFocus: () => void | Promise<void>,
) {
  const isInitialFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isInitialFocusRef.current) {
        isInitialFocusRef.current = false;
        return;
      }
      void refreshOnFocus();
    }, [refreshOnFocus]),
  );
}
