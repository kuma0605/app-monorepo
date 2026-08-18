# useFilters Hook 指南

`useFilters` 是一个专门用于管理列表筛选状态的 Hook。它在标准 `useState` 的基础上增加了同步引用维护和重置信号机制，解决了在 React 异步更新机制下，“设置条件后立即查询”可能导致参数滞后的问题。

## 1. 核心 API

```typescript
const {
  filters,
  filtersRef,
  updateFilter,
  setFilters,
  resetFilters,
  consumeResetSignal,
} = useFilters<T>(initialValues);
```

### 返回值说明

| 变量/方法            | 类型                                        | 说明                                                                                                      |
| :------------------- | :------------------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| `filters`            | `T`                                         | 响应式状态对象。**用于驱动 UI 渲染**（如输入框回显、Picker 选中态）。                                     |
| `filtersRef`         | `MutableRefObject<T>`                       | 同步引用对象。**用于在 API 请求中读取参数**，确保获取的是最新值。                                         |
| `updateFilter`       | `(key, value) => void`                      | 更新单个筛选字段，同时同步更新 `filtersRef` 和异步更新 `filters`。                                        |
| `setFilters`         | `(nextState) => void`                       | 覆盖整个筛选对象，支持函数式更新。                                                                        |
| `resetFilters`       | `(options?: { refresh?: boolean }) => void` | 将状态重置为初始值。默认不埋重置信号；传 `{ refresh: true }` 时可配合 `consumeResetSignal` 自动 refresh。 |
| `consumeResetSignal` | `() => boolean`                             | 检查并消费重置信号。仅在 `resetFilters({ refresh: true })` 后返回 `true`。                                |

## 2. 为什么需要 `filtersRef`？

React 的 `setState` 是异步的。如果你在代码中这样做：

```typescript
// ❌ 错误做法：在异步更新未完成时触发查询
updateFilter('keyword', '张三');
refresh(); // refresh 内部读取的 filters 依然是旧值
```

通过引入 `filtersRef`，`updateFilter` 在被调用时会**立即**修改 Ref 的值，从而保证随后的 `refresh()` 能够同步获取到最新参数：

```typescript
// ✅ 正确做法：fetcher 内部通过 filtersRef 读取参数
const fetcher = useCallback(
  params => {
    return api({...params, keyword: filtersRef.current.keyword});
  },
  [filtersRef],
);
```

## 3. 使用示例

### 搭配 `usePaginatedList` 使用

```tsx
import {useFilters} from '@/hooks/useFilters';
import {usePaginatedList} from '@/hooks/usePaginatedList';

const MyList = () => {
  const {filters, filtersRef, updateFilter, resetFilters, consumeResetSignal} =
    useFilters({keyword: '', type: 1});

  const fetcher = useCallback(params => {
    return queryList({
      ...params,
      keyword: filtersRef.current.keyword,
      type: filtersRef.current.type,
    });
  }, []); // 依赖项可为空，因为 filtersRef 引用地址不变

  const {refresh, data} = usePaginatedList({fetcher});

  const onSearchSubmit = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <SearchBar
        value={filters.keyword}
        onChange={v => updateFilter('keyword', v)}
        onSubmit={onSearchSubmit}
      />
      {/* 列表渲染... */}
    </>
  );
};
```

如需「重置后立刻 refresh」（非默认），可显式传参：

```tsx
resetFilters({refresh: true});

useEffect(() => {
  if (consumeResetSignal()) {
    refresh();
  }
}, [filters, refresh, consumeResetSignal]);
```

草稿模式（推荐）：顶栏 Tab「重置」经 `DaDropdown` 同步清空对应筛选状态（`onConfirm`），默认不 `refresh()`；「确定」或菜单项 `resetRefresh: true` 的重置由组件调用 `onRefresh`。多 Tab 联动重置后，可再点「确定」或搜索「查询」统一拉数。详见 [通用列表页指南 §12](../usage/通用列表页指南.md)。

## 4. 实现细节：`setFilters` 的 updater 类型断言

`setFilters` 模仿 React 原生 `useState` 的 setter，支持两种调用形态：

```typescript
// 形态 A：直接传新值
setFilters({keyword: '张三', type: 1});

// 形态 B：传 updater 函数（基于旧状态算新状态）
setFilters(prev => ({...prev, type: prev.type + 1}));
```

所以参数类型是联合类型 `T | ((prev: T) => T)`。内部实现需要区分这两种形态：

```typescript path=src/hooks/useFilters.ts
const setFilters = useCallback((next: T | ((prev: T) => T)) => {
  if (typeof next === 'function') {
    filtersRef.current = (next as (prev: T) => T)(filtersRef.current);
  } else {
    filtersRef.current = next;
  }
  setFiltersState(filtersRef.current);
}, []);
```

### 为什么需要 `as (prev: T) => T`？

理论上 `typeof next === 'function'` 进入 `if` 分支后，TypeScript 应当能自动把 `next` 的类型收窄为 `(prev: T) => T`。**但实际上不行**——这是 TS 在联合类型同时包含「对象类型」与「函数类型」时的一个已知限制：因为函数本质上也是对象（可调用对象），TS 的收窄逻辑保守地放弃了收窄，于是 `next` 在 `if` 分支里依然是联合类型，不能直接当函数调用。

因此必须**显式断言**告诉 TS：这里就是函数。

### 为什么不用 `as any`？

早期实现写的是 `(next as any)(...)`，能跑但**丢失了所有类型信息**：返回值类型、参数类型、调用方式都不再被检查。如果未来联合类型签名调整（例如改成 `(prev: T) => Partial<T>`），这里出错也不会被 TS 捕获。

精确断言 `as (prev: T) => T` 与 `as any` 在运行时完全等价，但保留了类型校验，更安全也更可读。**写联合类型里的函数分支时，请总是用具体函数类型断言，避免 `as any`。**

## 5. 注意事项

1. **渲染用 State，逻辑用 Ref**：在 JSX 模板中必须绑定 `filters` 以保证 UI 实时响应；在 `fetcher` 或复杂的业务逻辑判断中，请务必使用 `filtersRef.current`。
2. **重置逻辑**：默认 `resetFilters()` 只清状态、不触发列表刷新。顶栏筛选的 refresh 由 `DaDropdown.onRefresh` 负责（见通用列表页指南 §12）；Slot 让用户点「查询」后再 `refresh()`。若「重置全部」后必须立刻拉数，使用 `resetFilters({ refresh: true })` 并配合 `consumeResetSignal`。
