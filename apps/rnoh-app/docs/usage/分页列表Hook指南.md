# 分页列表 Hook 指南 (usePaginatedList)

`usePaginatedList` 是项目中用于统一管理分页列表逻辑的自定义 Hook。它封装了数据请求、分页计算、数组合并、下拉刷新、上拉加载更多以及**详情页/操作页返回时单页精准刷新**的完整流转状态，能够大幅减少列表页面的样板代码。

---

## 1. 核心优势

- **代码复用**：无需在每个页面重复维护 `pageNum`、`hasMore`、`refreshing` 等状态。
- **返回列表精准刷新 (touchedPage)**：结合 `useListRefreshOnFocus`，仅请求被操作项所在的那一页数据，**完全保留滚动位置**，并在数据偏移时智能兜底。
- **自动去重与主键适配**：支持配置 `rowKey`（默认已兼容 `id`/`comId`/`code`），防止数据位移导致列表出现重复项。
- **行为统一**：确保全 App 的分页列表在交互逻辑上高度一致（如：防双击触发、加载阈值、数据合并规则）。

---

## 2. API 参考

### 输入参数 (Options)

| 参数名                          | 类型                            | 默认值             | 说明                                                                                       |
| :------------------------------ | :------------------------------ | :----------------- | :----------------------------------------------------------------------------------------- |
| **`fetcher`**                   | `(params) => Promise<Response>` | (必填)             | 接收 `{ pageNumber, pageSize }` 并发送数据请求的异步函数。                                 |
| `pageSize`                      | `number`                        | `10`               | 每页请求的条数。                                                                           |
| `autoLoad`                      | `boolean`                       | `true`             | 组件挂载时是否自动执行首次加载。                                                           |
| `isSuccess`                     | `(res) => boolean`              | `res.code === 200` | 自定义请求成功判定逻辑。                                                                   |
| `skipSilentRefreshWithoutClick` | `boolean`                       | `true`             | 静默刷新时，若无点击记录且列表已有数据，是否跳过请求以节省带宽。                           |
| `rowKey`                        | `(item) => string \| number`    | 自动匹配常用主键   | 主键提取器，依次提取 `id` $\rightarrow$ `comId` $\rightarrow$ `code` $\rightarrow$ `key`。 |

---

### 输出结果 (Result)

| 属性名                       | 类型                           | 说明                                                                           |
| :--------------------------- | :----------------------------- | :----------------------------------------------------------------------------- |
| **`data`**                   | `T[]`                          | 累积的列表数据数组。                                                           |
| **`total`**                  | `number`                       | 接口返回的总条数（缺失则为 0）。                                               |
| **`pageSize`**               | `number`                       | 当前使用的分页大小。                                                           |
| **`hasMoreThanOnePage`**     | `boolean`                      | 数据是否已超过一页，优先用 `total`，回退到 `data.length`。                     |
| **`loading`**                | `boolean`                      | 仅在首次加载或列表为空的加载时为 true，便于显示居中 loading 骨架屏。           |
| **`refreshing`**             | `boolean`                      | 下拉刷新状态（绑定给 `RefreshControl`）。                                      |
| **`loadingMore`**            | `boolean`                      | 是否正在执行上拉加载更多。                                                     |
| **`hasMore`**                | `boolean`                      | 是否还有更多数据（根据返回数据长度与 total 比较自动计算）。                    |
| **`pageNum`**                | `number`                       | 当前页码。                                                                     |
| \*\*`error`                  | `PaginatedError`               | 错误状态，请求失败或业务码错误时有值。                                         |
| **`listRef`**                | `RefObject`                    | 绑定到 FlatList 的 ref，用于滚动控制。                                         |
| **`scrollToTop`**            | `(animated?: boolean) => void` | 滚动到列表顶部。                                                               |
| **`refresh`**                | `() => Promise`                | 主动刷新列表的方法（重置到第 1 页，非静默下会自动调用 `scrollToTop(false)`）。 |
| **`refreshFirstPageSilent`** | `() => Promise`                | 静默刷新第 1 页。                                                              |
| **`refreshTouchedPage`**     | `() => Promise`                | 静默刷新上次点击的项所在的单页。                                               |
| **`onPullRefresh`**          | `() => Promise`                | 配合下拉刷新的回调方法（绑定给 `RefreshControl`）。                            |
| **`loadMore`**               | `() => void`                   | 触发加载更多的方法。                                                           |
| **`onItemPress`**            | `(index: number) => void`      | 详情点击回调，传入当前行的 `index`，用于精准单页更新。                         |

---

## 3. 使用步骤

### 第一步：定义 Fetcher

Fetcher 通常在页面内使用 `useCallback` 包装，并推荐使用 `filtersRef.current` 绕过 React 的异步 `setState` 闭包陷阱：

```tsx
const fetcher = useCallback(
  ({pageNumber, pageSize}) =>
    getAppMessageList(
      {
        pageNumber,
        pageSize,
        keywords: filtersRef.current.keywords, // 使用 Ref 获取同步最新的筛选条件
      },
      {noLoading: true}, // 关键：分页请求通常不显示全屏加载圈
    ),
  [filtersRef],
);
```

### 第二步：调用 Hook 并绑定聚焦刷新

在 Hook 选项中配置类型（如果主键非 `id` / `comId` / `code`，可额外传入 `rowKey`）：

```tsx
const {
  data: messageList,
  loading,
  refreshing,
  loadingMore,
  hasMore,
  listRef,
  scrollToTop,
  refresh,
  refreshTouchedPage,
  onPullRefresh,
  loadMore,
  onItemPress,
} = usePaginatedList<MessageItem>({
  fetcher,
  pageSize: 10,
});

// 返回页面时自动触发精准单页刷新
useListRefreshOnFocus(refreshTouchedPage);
```

### 第三步：绑定 FlatList 并传入点击索引

在列表项点击时，显式调用 `onItemPress(index)`，这样 Hook 就可以计算并在返回时刷新对应页面数据：

```tsx
const renderItem = ({item, index}: {item: MessageItem; index: number}) => (
  <TouchableOpacity
    onPress={() => {
      onItemPress(index); // ⚠️ 记录点击索引
      navigation.navigate('Detail', {id: item.id});
    }}>
    <Text>{item.title}</Text>
  </TouchableOpacity>
);

return (
  <FlatList
    ref={listRef}
    data={messageList}
    renderItem={renderItem}
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} />
    }
    onEndReached={loadMore}
    onEndReachedThreshold={0.3}
    ListFooterComponent={() => (
      <ListFooter
        loadingMore={loadingMore}
        hasMore={hasMore}
        isEmpty={messageList.length === 0}
      />
    )}
  />
);
```

---

## 4. 最佳实践与注意事项

### 4.1 自动与手动刷新的分流

- **下拉刷新**：使用 `onPullRefresh` 方法，它会清空列表并重拉第一页，同时在列表顶部展示 RefreshControl 下拉菊花。
- **主动搜索 / 筛选**：直接调用 `refresh()`。为了防止“滚动位置卡在底部导致无法触发上拉加载”的 RN 原生 Bug，非静默的 `refresh()` 内部已自动执行了 `scrollToTop(false)`（瞬间滚回顶部）。
- **返回列表自动刷新**：使用 `useListRefreshOnFocus(refreshTouchedPage)`。由于内部做了 `isInitialFocusRef` 的首次过滤，它**不会**在首次进入页面时与 `autoLoad` 抢占请求，只有当从详情页返回时才会发起静默单页更新。

### 4.2 设置 `noLoading: true` (推荐)

在 Fetcher 调用服务层 API 时，建议传入 `{ noLoading: true }`。
因为下拉刷新（RefreshControl）与上拉加载更多（ListFooter）已经提供了足够轻量的交互反馈，避免使用阻塞屏幕的全局 Loading 遮罩。
