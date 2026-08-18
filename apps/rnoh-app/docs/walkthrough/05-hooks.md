# 05 — 全局 Hook：跨业务复用的逻辑

## 全景

| Hook                    | 文件                             | 解决什么问题                     |
| ----------------------- | -------------------------------- | -------------------------------- |
| `usePaginatedList`      | `hooks/usePaginatedList.ts`      | 分页列表的 CRUD + 加载态         |
| `useFilters`            | `hooks/useFilters.ts`            | 筛选条件的状态管理（闭包保鲜）   |
| `useSelectBridge`       | `hooks/useSelectBridge.ts`       | 跨页面"选择-回传"通信            |
| `useTheme`              | `hooks/useTheme.ts`              | 主题色 / 颜色方案                |
| `useListRefreshOnFocus` | `hooks/useListRefreshOnFocus.ts` | 页面重新获得焦点时刷新           |
| `useScrollToTopFab`     | `hooks/useScrollToTopFab.ts`     | 滚动到一定高度显示"返回顶部"按钮 |

## usePaginatedList — 最核心的 hook

几乎所有列表页都用它。封装了：

```
fetch(参数) → 首次加载 + 分页
refresh()  → 下拉刷新
loadMore() → 上拉加载更多
remove(id) → 删除一条（本地乐观更新）
update(item)→ 修改一条（本地乐观更新）
```

**为什么抽出来？** MarketReg、SmartReg、Home 的 7 个待办页面长得几乎一样 — 都是"筛选 + 列表 + 分页"。用了这个 hook，页面的 JS 从 500 行降到 200 行。

数据流：

```
usePaginatedList(service.findXxxPage, filters)
  → 内部调 service → 拿回数据
  → 暴露 { data, loading, refresh, loadMore }
  → 组件只管渲染
```

## useFilters — 闭包保鲜

```ts
// 问题：setState 是异步的，连续调会覆盖
setFilters({...filters, type: 1});
setFilters({...filters, status: 2}); // type 丢了！

// 解决：useFilters 用 ref 做副本，读最新值
const [filters, setFilters] = useFilters(initial);
setFilters(prev => ({...prev, type: 1})); // 函数式更新，永远基于最新
setFilters(prev => ({...prev, status: 2})); // type 还在
```

所有列表页的筛选条件都走这个 hook，避免"筛选条件互相覆盖"的 bug。

## useSelectBridge — 跨页面选择

场景：在"选择检查人"页面选了人，要回传给"投诉详情"页面。

```
注册回调 → A 页面调 selectBridge.register(id, callback)
打开 B → B 页面调 selectBridge.pick(id, item)
回传   → A 页面的 callback 自动触发
```

不用 navigate back + 传参，不用 Redux 中转。特别适合"从列表选一条塞到表单"的场景。

## useTheme — 主题

```ts
const {colors, spacing, isDark} = useTheme();
```

从 `theme/colors.ts`、`theme/spacing.ts`、`theme/typography.ts` 读设计令牌，不写魔数。

## Hook 依赖方向

```
hooks → services（调 API）
hooks → store（读状态）
hooks → theme（读设计令牌）
hooks 永不引用 screens / components
```

**规则**：hook 是"逻辑层"的，它只知道"做什么"，不知道"画什么"。画什么是组件的事。
