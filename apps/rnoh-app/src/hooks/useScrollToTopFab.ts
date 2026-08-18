import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

/**
 * 列表纵向滚动超过该值才显示「回到顶部」（回顶后 offset≈0 则隐藏）。
 * 取窗口高度的一半，保证「滚过约半屏」才弹按钮，且兼容不同尺寸设备。
 */
const DEFAULT_OFFSET_THRESHOLD = Dimensions.get('window').height * 0.5;

/** scrollBind 内置的节流值（约 60fps）。一般不需要外部覆盖。 */
const DEFAULT_THROTTLE = 16;

export interface UseScrollToTopFabOptions {
  /** 该值变化时强制隐藏 FAB（例：首页切换 Tab 时复位可见性） */
  resetVisibilityKey?: string | number;
  /** 触发显示的滚动偏移阈值，默认窗口高度的 50% */
  offsetThreshold?: number;
  /** 是否启用，默认 true。若为 false 则始终不显示 */
  enabled?: boolean;
}

/**
 * 「回到顶部」FAB：纯滚动偏移驱动可见性，与分页 Hook 无关。
 * 兼容 FlatList, ScrollView, FlashList 等支持 onScroll 的组件。
 */
export function useScrollToTopFab({
  resetVisibilityKey,
  offsetThreshold = DEFAULT_OFFSET_THRESHOLD,
  enabled = true,
}: UseScrollToTopFabOptions = {}) {
  // 只在 state 中保存 boolean 值，避免高频触发整个组件重绘
  const [scrollToTopFabVisible, setScrollToTopFabVisible] = useState(false);

  // 使用 ref 来追踪最新的可见性状态，避免在 onScroll 闭包中拿到旧值
  const isVisibleRef = useRef(false);
  const thresholdRef = useRef(offsetThreshold);
  thresholdRef.current = offsetThreshold;
  // 用 ref 承载 enabled，避免每次切换都重建 onScroll 与 scrollBind 引用
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const onListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!enabledRef.current) {
        return;
      }
      const offsetY = event.nativeEvent.contentOffset.y;
      const shouldShow = offsetY > thresholdRef.current;

      // 仅在可见性确实发生变化时才调用 setState
      if (shouldShow !== isVisibleRef.current) {
        isVisibleRef.current = shouldShow;
        setScrollToTopFabVisible(shouldShow);
      }
    },
    [],
  );

  useEffect(() => {
    if (resetVisibilityKey !== undefined || !enabled) {
      isVisibleRef.current = false;
      setScrollToTopFabVisible(false);
    }
  }, [resetVisibilityKey, enabled]);

  const scrollBind = useMemo(
    () => ({
      onScroll: onListScroll,
      scrollEventThrottle: DEFAULT_THROTTLE,
    }),
    [onListScroll],
  );

  return {
    scrollBind,
    scrollToTopFabVisible,
  };
}

export type UseScrollToTopFabReturn = ReturnType<typeof useScrollToTopFab>;
