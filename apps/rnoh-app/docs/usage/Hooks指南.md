# Hooks 使用指南

本文档汇总项目中使用的自定义 Hook 及 React Navigation 提供的常用 Hook。

---

## 1. 屏幕生命周期 — useFocusEffect

来自 `@react-navigation/native`，在**屏幕获得焦点时**执行副作用，适用于 Tab 切换刷新、从子页面返回时重新拉取数据等场景。

### 与 useEffect 的区别

|                 | `useEffect`          | `useFocusEffect`       |
| --------------- | -------------------- | ---------------------- |
| 触发时机        | 组件挂载 / 依赖变化  | 屏幕获得焦点时         |
| Bottom Tab 切换 | 不触发（组件未卸载） | 每次切回都触发         |
| 从子页面返回    | 不触发               | 触发                   |
| 失焦清理        | 组件卸载时           | 失去焦点时（返回函数） |

### 基本用法

```tsx
import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';

function MyScreen() {
  useFocusEffect(
    useCallback(() => {
      // 获焦时执行
      fetchData();

      // 可选：失焦时清理
      return () => {
        // 停止监听、取消请求等
      };
    }, []),
  );
}
```

### 注意事项

- 回调**必须**用 `useCallback` 包裹，否则每次渲染都会重新订阅，导致重复执行
- Bottom Tab 切换、`navigation.goBack()` 返回、Drawer 开关都会触发
- 返回的清理函数在屏幕**失去焦点**时执行，不是组件卸载时

### 适用场景

| 场景           | 说明                                 |
| -------------- | ------------------------------------ |
| Tab 页数据刷新 | 切换底部 Tab 时重新拉取最新数据      |
| 列表页刷新     | 从详情页返回后重新加载列表           |
| 焦点监听       | 屏幕聚焦时启动 WebSocket，失焦时断开 |
| 表单重置       | 离开页面时清空临时状态               |

### 项目中的实际用法

底部 Tab 页面需要在切回时刷新数据，使用 `useFocusEffect` 替代 `useEffect`：

```tsx
// src/screens/Home/index.tsx — 切回首页时拉取最新消息
useFocusEffect(
  useCallback(() => {
    fetchMessages();
  }, [fetchMessages]),
);

// src/screens/MarketReg/index.tsx — 切回市场监管时刷新菜单
useFocusEffect(
  useCallback(() => {
    dispatch(fetchUserMenu());
  }, [dispatch]),
);
```

---

## 2. 「回到顶部」驱动 — useScrollToTopFab

用于监听列表滚动偏移量，控制「回到顶部」按钮（FAB）的可见性。兼容 `FlatList`、`ScrollView` 等标准滚动组件。

### 基本用法

```tsx
import {useScrollToTopFab} from '@/hooks/useScrollToTopFab';

function MyList() {
  const {scrollBind, scrollToTopFabVisible} = useScrollToTopFab({
    offsetThreshold: 100, // 可选：滚动超过 100 显示按钮
    resetVisibilityKey: currentTab, // 可选：Tab 切换时重置可见性
  });

  return (
    <>
      <FlatList
        {...scrollBind} // 绑定 onScroll 和 scrollEventThrottle
        // ... 其他属性
      />
      {scrollToTopFabVisible && <MyFab />}
    </>
  );
}
```

### 参数说明 (Options)

| 参数                 | 类型               | 默认值         | 说明                                           |
| :------------------- | :----------------- | :------------- | :--------------------------------------------- |
| `offsetThreshold`    | `number`           | 窗口高度的 50% | 触发显示的滚动偏移阈值（默认随设备高度自适应） |
| `resetVisibilityKey` | `string \| number` | -              | 当该值变化时，强制隐藏 FAB                     |
| `enabled`            | `boolean`          | `true`         | 是否启用，若为 `false` 则始终不显示            |

### 返回值说明 (Returns)

| 变量/方法               | 类型      | 说明                                                            |
| :---------------------- | :-------- | :-------------------------------------------------------------- |
| `scrollBind`            | `object`  | 包含 `onScroll` 和 `scrollEventThrottle` 的对象，需展开传给列表 |
| `scrollToTopFabVisible` | `boolean` | 控制 FAB 是否显示的布尔值                                       |

### 与分页 Hook 联动示例

对于分页列表，通常只在数据量超过一页时才允许显示「回到顶部」。
`usePaginatedList` 已派生 `hasMoreThanOnePage`（兼容 `total` 缺省的接口，
内部回退到 `data.length > pageSize`），业务页直接透传即可：

```tsx
const {hasMoreThanOnePage, listRef, scrollToTop} = usePaginatedList({ ... });

const {scrollBind, scrollToTopFabVisible} = useScrollToTopFab({
  enabled: hasMoreThanOnePage, // 只有存在多页数据时才启用 FAB
});

return (
  <>
    <FlatList ref={listRef} {...scrollBind} ... />
    <PaginatedListScrollToTopFab visible={scrollToTopFabVisible} onPress={scrollToTop} />
  </>
);
```

---

<!-- 后续新增 Hook 在此章节继续追加，格式保持一致 -->
