# 01 — 启动链路：从 index.js 到页面

一次冷启动发生了什么？

## 1. JS 入口 → Redux Store

```
index.js → src/store/index.ts → src/store/hooks.ts
```

`src/store/index.ts` 只做一件事：用 `configureStore` 把六个 slice 拼起来：

| Slice              | 文件                     | 状态                           |
| ------------------ | ------------------------ | ------------------------------ |
| `user`             | `slices/userSlice.ts`    | 用户 profile、实名状态、登录态 |
| `menu`             | `slices/menuSlice.ts`    | 当前用户的菜单树               |
| `app`              | `slices/appSlice.ts`     | 主题色、站点名、系统信息、更新 |
| `refData`          | `slices/refDataSlice.ts` | 字典、组织树、分类等参考数据   |
| `global`           | `slices/globalSlice.ts`  | 轻量全局标志位                 |
| `（AsyncStorage）` | `@/native/asyncStorage`  | 持久化驱动（三端适配）         |

Redux store 创建时还会注入 apiClient 的 token provider，让每次请求自动带 token — 这是 UI 层不需要关心登录态的原因。

## 2. 类型安全的 hooks

`src/store/hooks.ts` 暴露了三个东西：

```ts
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const selectUserId = createSelector(selectUserState, u => u.profile?.id);
```

**为什么包一层？** 原生 `useSelector` 拿到的 `state` 是 `any`，写了不报错。包了之后 `state.user.profile.name` 自动有类型，写错属性名立刻红线。

所有组件通过 `useAppSelector` 拿数据，通过 `useAppDispatch` 派发 action。selector 用 `createSelector` 做了记忆化 — `state.user` 没变就不会重渲染。

## 3. 路由注册

启动完成后进入导航层：

```
src/navigation/rootStackScreenRegistry.tsx   ← 唯一真相源
         ↓
src/navigation/rootStack.tsx                 iOS/Android
src/navigation/rootStack.harmony.tsx         鸿蒙（额外关闪屏）
```

`rootStackScreenRegistry.tsx` 是这栋楼的**目录大堂**：

- 它不用 `import` 屏幕，而是用 `lazy()` + `React.lazy` 注册了约 17 个顶级屏幕
- 屏幕被真正打开时才加载，首屏不卡顿
- 新增页面？在这一个文件里加一行就行

路径解码：

| 文件                                | 位置        | 作用                                     |
| ----------------------------------- | ----------- | ---------------------------------------- |
| `defaultSubStackScreenOptions.tsx`  | navigation/ | 子页面默认样式统一设定                   |
| `SubStackHeaderBack.tsx`            | navigation/ | 子页面返回按钮统一样式                   |
| `devDemoStack.tsx` & `.harmony.tsx` | navigation/ | 调试 Demo 入口（日历、图表、文件选择等） |

## 4. 分层加载顺序

| 顺序  | 层   | 关键文件                               |
| ----- | ---- | -------------------------------------- |
| ① ─── | 启动 | index.js, store/index.ts               |
| ② ─── | 状态 | store/slices/\*.ts, store/hooks.ts     |
| ③ ─── | 导航 | navigation/rootStackScreenRegistry.tsx |
| ④ ─── | 服务 | services/apiClient.ts                  |
| ⑤ ─── | 屏幕 | screens/\*\*/index.tsx                 |

每一层都**通过接口依赖上层**（selector / hook / ref），不直接碰内部。

## 5. 一个冷启动读下来

```
App 启动
  → store/index.ts configureStore（拼 slice、接 token provider）
  → store/hooks.ts  暴露 useAppSelector / useAppDispatch
  → navigation/rootStackScreenRegistry.tsx  lazy 注册所有屏幕
  → navigation/rootStack[.harmony].tsx  根据平台选一个挂载
  → 挂载第一个屏幕（通常是 Home 或 Me）
  → 屏幕 useAppSelector 拿 user.profile 判断登录态
  → 没跳 login，跳了 home
  → home 调 services/apiClient 拉数据
```

**从下往上读是依赖，从上往下读是调用。** 这个方向在后面的每一篇都成立。
