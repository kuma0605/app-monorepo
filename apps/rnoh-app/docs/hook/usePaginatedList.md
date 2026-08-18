# usePaginatedList Hook 指南

`usePaginatedList` 是一个高度封装的分页加载自定义 Hook，旨在统一处理列表的分页逻辑、状态管理（加载中、刷新中、加载更多）、并发控制以及**详情页/操作页返回时的精准单页局部刷新**。

## 1. 核心功能

- **错误处理**：显式导出 `error` 状态，捕获 API 失败或业务逻辑错误（`code !== 200`）。
- **自动化状态管理**：内置 `refreshing`（下拉刷新）、`loading`（首次加载/空白加载）、`loadingMore`（上拉加载更多）状态。
- **并发控制与延迟锁**：通过 `isFetchingRef` 同步锁防止重复请求，并在刷新结束后增加 `500ms` 的延时释放锁保护，防止布局重新排版抖动自动触发 `onEndReached`。
- **卸载守护**：内置 `isMountedRef`，确保组件卸载后不再执行 `setState`，避免内存泄漏警告。
- **闭包陷阱处理**：使用 `useRef` 维护页码和回调（如 `fetcher`、`rowKey` 等），确保异步回调中获取的是最新值。
- **单页精准刷新 (touchedPage)**：配合 `useListRefreshOnFocus`，仅静默刷新被修改的单页，保持其他页数据和滚动条位置不变，并支持防偏移安全校验及去重。

---

## 2. 逻辑流转图

```mermaid
graph TD
    A[组件挂载 / autoLoad] --> B{调用 fetchData}
    C[调用 refresh 方法] --> B
    D[调用 loadMore 方法] --> B
    E[返回页面 / refreshTouchedPage] --> B

    B --> F[检查 isFetchingRef 锁]
    F -- 已锁定 --> G[忽略请求]
    F -- 未锁定 --> H[加锁 isFetchingRef = true]

    H --> I{判断 scope 作用域}
    I -- firstPage --> J[重置为第 1 页请求]
    I -- touchedPage --> K[根据最后点击索引计算所在页码并请求]

    K --> L[执行传入的 fetcher API]
    L --> M{请求成功 & isSuccess?}
    M -- 是 --> N{是否为 touchedPage?}

    N -- 否 --> O[全量替换或上拉追加数据]
    N -- 是 --> P[安全防偏移校验 & 替换单页切片 & 自动去重]

    P -- 校验失败 --> Q[自动释放锁并降级触发 Page 1 刷新]
    P -- 校验成功 --> R[更新 data & 保持 pageNumRef 页数状态]

    O --> S[更新 pageNumRef & hasMore]
    R --> S
    M -- 否 --> T[记录 setError(res / err)]

    S --> U[延迟 500ms/100ms 后释放锁 isFetchingRef = false]
    T --> U
    U --> V[检查 isMountedRef 并重置加载状态]
```

---

## 3. 参数说明 (Options)

| 参数                            | 类型     | 必填 | 默认值                                                         | 说明                                                 |
| :------------------------------ | :------- | :--- | :------------------------------------------------------------- | :--------------------------------------------------- |
| `fetcher`                       | Function | 是   | -                                                              | 执行 API 请求的函数，接收 `pageNumber`, `pageSize`   |
| `pageSize`                      | number   | 否   | 10                                                             | 每页请求的数量                                       |
| `autoLoad`                      | boolean  | 否   | true                                                           | 是否在组件挂载时自动执行初始化加载                   |
| `isSuccess`                     | Function | 否   | `(res) => res.code === 200`                                    | 自定义判断请求是否成功的逻辑                         |
| `skipSilentRefreshWithoutClick` | boolean  | 否   | `true`                                                         | 静默刷新时，若无点击记录且列表已有数据，是否跳过请求 |
| `rowKey`                        | Function | 否   | `(item) => item?.id ?? item?.comId ?? item?.code ?? item?.key` | 主键提取器，用于防偏移校验和去重                     |

---

## 4. 返回值说明 (Returns)

| 变量/方法                | 类型                | 说明                                                                   |
| :----------------------- | :------------------ | :--------------------------------------------------------------------- |
| `data`                   | `T[]`               | 当前列表的所有数据（已包含分页合并）                                   |
| `total`                  | number              | 数据总条数                                                             |
| `pageSize`               | number              | 每页请求的数量                                                         |
| `hasMoreThanOnePage`     | boolean             | 数据是否已超过一页（基于 total 或 data.length）                        |
| `loading`                | boolean             | 首次加载/列表为空时的加载状态，用于列表居中 Loading                    |
| `refreshing`             | boolean             | 下拉刷新状态（绑定给 `RefreshControl`）                                |
| `loadingMore`            | boolean             | 是否处于上拉加载更多状态                                               |
| `hasMore`                | boolean             | 是否还有更多数据（基于当前长度与 total 比较判断）                      |
| `pageNum`                | number              | 当前页码                                                               |
| `error`                  | `PaginatedError<T>` | 捕获到的错误对象                                                       |
| `listRef`                | `Ref<FlatList<T>>`  | 绑定到 FlatList 的 ref，用于滚动和定位控制                             |
| `scrollToTop`            | Function            | 滚动到列表顶部的便捷方法，接收 `animated?: boolean`                    |
| `refresh`                | Function            | 主动刷新列表（重置到第 1 页，非静默下会自动调用 `scrollToTop(false)`） |
| `refreshFirstPageSilent` | Function            | 静默刷新第一页                                                         |
| `refreshTouchedPage`     | Function            | 静默刷新上次点击的项所在的页面                                         |
| `onPullRefresh`          | Function            | 下拉刷新专用的方法（配合 `RefreshControl`）                            |
| `loadMore`               | Function            | 加载下一页的方法（配合 `onEndReached`）                                |
| `onItemPress`            | Function            | 点击列表项进入详情时调用，接收 `index: number` 记录点击索引            |

---

## 5. 返回列表精准刷新策略 (touchedPage)

### 5.1 痛点背景

在 ToB/ToG 应用中，用户可能将列表翻到了第 3 页，点击某一项进行修改后返回列表：

- 如果每次都从第一页全局刷新，滚动条会复位到最顶部，导致用户丢失阅读进度，体验极差。
- 如果不刷新，列表上数据的状态修改就无法实时同步。

### 5.2 解决方案

利用 `refreshTouchedPage` 与 `onItemPress` 进行**局部单页静默更新**：

1. **记录索引**：点击项进入详情时，调用 `onItemPress(index)`。
2. **聚焦刷新**：使用 `useListRefreshOnFocus(refreshTouchedPage)`。
3. **按需请求**：返回列表时，根据 index 和 pageSize 计算出该条数据在哪一页，仅请求这一个页码的数据。
4. **切片替换**：收到单页响应后，通过 `slice` 替换原列表对应区间，并自动清除由于数据偏移可能导致的重复项。
5. **安全校验**：校验点击的项是否仍在被更新的单页数据中。如果不幸被其他人删除或挤出该页（即 offset 漂移），则自动降级重新加载第一页，保证数据一致性。

---

## 6. 使用示例

```tsx
import React, {useCallback} from 'react';
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {usePaginatedList} from '@/hooks/usePaginatedList';
import {useListRefreshOnFocus} from '@/hooks/useListRefreshOnFocus';
import {fetchUserList} from '@/services/user';
import ListFooter from '@/components/ListFooter';

interface UserItem {
  comId: string; // 唯一主键
  name: string;
}

const UserList = ({navigation}) => {
  const fetcher = useCallback(
    ({pageNumber, pageSize}) =>
      fetchUserList({
        page: pageNumber,
        size: pageSize,
      }),
    [],
  );

  const {
    data,
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
  } = usePaginatedList<UserItem>({
    fetcher,
    pageSize: 10,
    // ⚠️ 如果主键不是 .id，而默认值支持检测 comId，则可以不用传 rowKey；
    // 如果主键命名极其特殊（如 userUniqueNo），请配置 rowKey:
    rowKey: item => item.comId,
  });

  // 返回页面时自动触发精准单页刷新
  useListRefreshOnFocus(refreshTouchedPage);

  const renderItem = ({item, index}: {item: UserItem; index: number}) => (
    <TouchableOpacity
      style={{padding: 16, borderBottomWidth: 1, borderColor: '#eee'}}
      onPress={() => {
        onItemPress(index); // ⚠️ 记录点击索引
        navigation.navigate('UserDetail', {id: item.comId});
      }}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={item => item.comId}
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
          isEmpty={data.length === 0}
        />
      )}
    />
  );
};
```
