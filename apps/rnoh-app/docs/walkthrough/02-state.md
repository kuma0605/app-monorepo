# 02 — 状态管理：Redux 怎么运转

## 整体架构

```
                ┌─────────────────────────────────────┐
                │          Redux Store                │
                │  configureStore({ reducer: {        │
                │    user, menu, app, refData, global  │
                │  }})                                │
                └──────────────┬──────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
  useAppSelector         useAppDispatch         createSelector
  (读数据)               (派发 action)          (记忆化派生)
```

## 六个 Slice

| Slice              | 文件                     | 核心状态                           | 典型 selector                         |
| ------------------ | ------------------------ | ---------------------------------- | ------------------------------------- |
| `user`             | `slices/userSlice.ts`    | profile、realStatus、loginCount    | `selectUserId`、`selectRealStatus`    |
| `menu`             | `slices/menuSlice.ts`    | menuData（菜单树）                 | `selectMenuData`                      |
| `app`              | `slices/appSlice.ts`     | primaryColor、siteInfo、systemInfo | `selectPrimaryColor`、`selectAppName` |
| `refData`          | `slices/refDataSlice.ts` | 字典、组织树、分类、类型列表       | —                                     |
| `global`           | `slices/globalSlice.ts`  | 轻量全局标志                       | —                                     |
| `（AsyncStorage）` | 持久化                   | 跨会话保留                         | —                                     |

## 数据怎么流

**写方向（组件 → store）：**

```
组件事件
  → useAppDispatch()(action)
  → slice reducer 处理
  → state 更新
  → 订阅该 slice 的组件重渲染
```

**读方向（store → 组件）：**

```
useAppSelector(selectUserId)
  → createSelector 先跑 selectUserState（取 state.user）
  → 再跑 user => user.profile?.id
  → 引用没变 → 不重渲染
```

## 为什么用 createSelector

```ts
// 没有记忆化 — 每次返回新引用，组件无意义重渲染
const name = useAppSelector(s => s.user.profile?.name);

// 有记忆化 — state.user 没变就返回同一个值
const selectUsername = createSelector(
  selectUserState, // 输入：只盯 state.user
  user => user.profile?.name, // 输出：从 user 里取 name
);
```

`selectUserState` 是公共输入选择器，`selectUserId`、`selectUsername`、`selectRealStatus` 三个 selector 共用，避免重复写 `state => state.user`。

## 跨 slice 交互

一个 action 可能影响多个 slice 吗？**在 SAMRApp 里不常见。** 每个 slice 管自己的领域：

- `userSlice` 管登录/登出
- `menuSlice` 管菜单
- `refDataSlice` 管参考数据（字典、组织树）

它们通过 `store/index.ts` 的 `configureStore` 组合，但彼此不直接引用。如果屏幕需要跨 slice 数据（比如"当前用户的菜单"），在组件里分别调两个 selector 就行。

## 持久化

`src/native/asyncStorage.harmony.ts` 是 AsyncStorage 的鸿蒙适配层。Redux store 创建时接了这个驱动，让 `user` slice 的登录态可以跨会话保留 — 下次打开 App 还在登录态。

## 实际例子：登录流程

```
用户点登录
  → dispatch(login(credentials))
  → userSlice.reducer 处理：profile = response.user
  → selectUserId 返回新 id
  → 订阅了 selectUserId 的组件（比如 Me 页面）重渲染
  → Me 页面显示用户名
```

**关键：没有任何组件手动"监听"登录态。** 都是 selector 自动派发 → 自动重渲染。
