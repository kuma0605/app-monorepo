# Root Stack Screen Registry 类型定义指南

> 本文解读 `src/navigation/rootStackScreenRegistry.tsx` 中涉及的 TypeScript 类型定义，
> 帮助理解屏幕注册表的类型设计、`Record` 内置工具类型、以及 `as` / `as unknown as` 类型断言的使用场景。

---

## 1. 核心类型一览

```
┌─────────────────────────────────────────────────────────┐
│  types.ts                                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ RootStackParamList                              │    │
│  │  = {Auth, Main}                                 │    │
│  │    & HomeRootParamList                          │    │
│  │    & MarketRegRootParamList                     │    │
│  │    & SmartRegRootParamList                      │    │
│  │    & MeRootParamList                            │    │
│  └─────────────────────────────────────────────────┘    │
│                        │                                 │
│           Exclude<keyof ..., 'Auth' | 'Main'>           │
│                        ▼                                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │ RootStackRegisteredScreenName                   │    │
│  │  = '/Home/FoodCertificate'                      │    │
│  │    | '/Market/DailyInspection'                  │    │
│  │    | '/Me/PersonalInfo'                         │    │
│  │    | ...                                        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  rootStackScreenRegistry.tsx                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │ RootStackScreen                                 │    │
│  │  = ComponentType<Record<string, unknown>>       │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ RootStackScreenEntry                            │    │
│  │  = { name, component, options }                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ROOT_STACK_SCREEN_REGISTRY: RootStackScreenEntry[]     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. `Record<K, V>` — TypeScript 内置工具类型

`Record` 是 TypeScript **标准库自带的工具类型**（定义在 `lib.es5.d.ts`），不需要从任何库导入。

### 签名

```ts
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

含义：构造一个对象类型，其键类型为 `K`，值类型为 `T`。

### 在本文件中的用法

```ts
type RootStackScreen = ComponentType<Record<string, unknown>>;
```

`Record<string, unknown>` 等价于 `{ [key: string]: unknown }`，表示：

- **键**：任意 `string`
- **值**：`unknown`（类型安全的"任意值"）

之所以用 `Record<string, unknown>` 而不是指定具体的 props 类型，是因为注册表中存放的是**来自不同模块的屏幕组件**，每个屏幕的 props 形状各异。这里取一个"最大公约数"类型，在注册表层面无需关心每个屏幕的具体 props。

### 为什么用 `unknown` 而不是 `any`

| 特性           | `any`                  | `unknown`                    |
| -------------- | ---------------------- | ---------------------------- |
| 赋值给任意类型 | 允许（跳过检查）       | 不允许（必须先收窄）         |
| 调用方法       | 允许                   | 不允许                       |
| 访问属性       | 允许                   | 不允许                       |
| 安全性         | 低（静默跳过所有检查） | 高（强制类型收窄后才能使用） |

使用 `unknown` 是有意为之 — 迫使下游代码在使用前明确断言或收窄类型。

---

## 3. `RootStackScreen`

```ts
type RootStackScreen = ComponentType<Record<string, unknown>>;
```

表示"接受任意对象作为 props 的 React 组件"。它是注册表中所有屏幕组件的统一类型。

### 为什么要定义这个别名

1. **语义化**：`RootStackScreen` 比 `ComponentType<Record<string, unknown>>` 更易读。
2. **统一约束**：注册表中 48+ 个屏幕，无论各屏幕实际 props 是什么，在注册表层面统一为同一类型。
3. **与 React Navigation 兼容**：React Navigation 的 `<Stack.Screen component={...}>` 接受 `ComponentType<any>`，此处用 `unknown` 更安全。

---

## 4. `RootStackScreenEntry`

```ts
type RootStackScreenEntry = {
  name: RootStackRegisteredScreenName;
  component: RootStackScreen;
  options: {title: string; headerShown?: boolean};
};
```

描述注册表中的**一个屏幕条目**：

| 字段        | 类型                            | 说明                                   |
| ----------- | ------------------------------- | -------------------------------------- |
| `name`      | `RootStackRegisteredScreenName` | 路由名，受 `types.ts` 中的参数列表约束 |
| `component` | `RootStackScreen`               | 该路由对应的 React 组件                |
| `options`   | `{title; headerShown?}`         | React Navigation 屏幕选项              |

### `RootStackRegisteredScreenName` 的来源

```ts
// types.ts
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
} & HomeRootParamList &
  MarketRegRootParamList &
  SmartRegRootParamList &
  MeRootParamList;

export type RootStackRegisteredScreenName = Exclude<
  keyof RootStackParamList,
  'Auth' | 'Main'
>;
```

`Exclude` 排除 `Auth` 和 `Main`（它们是顶层 shell 页面，单独注册），
剩下的就是所有业务屏幕的路由名字面量联合类型，例如：

```
'/Home/FoodCertificate' | '/Home/FoodUser' | ... | '/Market/DailyInspection' | ... | '/Me/PersonalInfo' | ...
```

这确保了注册表中每个 `name` 都必须是 `RootStackParamList` 中已声明的路由，**编译期即可发现拼写错误**。

---

## 5. `lazyScreen` 与类型断言

### 函数签名

```ts
function lazyScreen(getter: () => RootStackScreen): RootStackScreen;
```

- **参数**：`getter` — 一个 thunk（无参函数），调用时才执行 `require()` 加载模块。
- **返回值**：一个包装组件，首次渲染时才调用 `getter()`。

### 内部实现中的类型断言

```ts
function lazyScreen(getter: () => RootStackScreen): RootStackScreen {
  function LazyScreen(props: Record<string, unknown>) {
    const Cmp = getter();
    return (Cmp as Function)(props) as React.ReactElement;
  }
  return LazyScreen as unknown as RootStackScreen;
}
```

这里涉及两种断言模式，正好用来解释 `as` 与 `as unknown as` 的区别。

---

## 6. `as` vs `as unknown as` — 何时用哪个

### 单 `as` 断言

适用于源类型和目标类型**有某种关联**（兼容、子类型、或其中一方是 `any`/`unknown`）：

```ts
// require() 返回 any，any → RootStackScreen 允许直接 as
require('@/screens/...').default as RootStackScreen;

// 联合类型收窄
const value: string | number = getValue();
const str = value as string;

// any → 任意类型
const data = JSON.parse(text) as UserResponse;
```

**可以使用单 `as` 的场景：**

- 源类型是 `any` 或 `unknown`
- 源类型是目标类型的子类型或父类型
- 联合类型收窄

### 双重 `as unknown as` 断言

适用于源类型和目标类型**完全不相关**，TypeScript 会拒绝直接 `as`：

```ts
// LazyScreen 是普通函数，RootStackScreen 是 ComponentType<...>
// 两者结构不兼容 — TS 不允许直接 cast
LazyScreen as unknown as RootStackScreen;
```

原理是通过一个"万能中间类型"中转：

```
LazyScreen  →  as unknown  →  as RootStackScreen
(普通函数)      (顶层类型)      (ComponentType)
```

1. `as unknown`：任何类型都可以转为 `unknown`
2. `as RootStackScreen`：`unknown` 可以转为任何类型

### 对照表

| 场景                 | 断言方式        | 示例                               |
| -------------------- | --------------- | ---------------------------------- |
| 源是 `any`           | 单 `as`         | `require(...).default as Foo`      |
| 联合类型收窄         | 单 `as`         | `value as string`                  |
| 子类型 → 父类型      | 无需断言        | 自动兼容                           |
| **不相关类型**       | `as unknown as` | `func as unknown as ComponentType` |
| 强制转换（绕过检查） | `as unknown as` | 任意场景兜底                       |

### 在本文件中的两处断言

```ts
// ① 单 as：require() 返回 any，any → RootStackScreen 合法
require('@/screens/Home/FoodCertificate').default as RootStackScreen;

// ② 双重 as：普通函数 → ComponentType，类型不兼容，需要中转
return LazyScreen as unknown as RootStackScreen;
```

---

## 7. 注册表数组与最终导出

### 按 Tab 分组

```ts
const ROOT_STACK_SCREENS_HOME_TAB: RootStackScreenEntry[] = [ ... ];
const ROOT_STACK_SCREENS_MARKET_REG_TAB: RootStackScreenEntry[] = [ ... ];
const ROOT_STACK_SCREENS_SMART_REG_TAB: RootStackScreenEntry[] = [];
const ROOT_STACK_SCREENS_ME_TAB: RootStackScreenEntry[] = [ ... ];
```

按底部 Tab 模块分组，便于维护和定位。

### 合并导出

```ts
export const ROOT_STACK_SCREEN_REGISTRY: RootStackScreenEntry[] = [
  ...ROOT_STACK_SCREENS_HOME_TAB,
  ...ROOT_STACK_SCREENS_MARKET_REG_TAB,
  ...ROOT_STACK_SCREENS_SMART_REG_TAB,
  ...ROOT_STACK_SCREENS_ME_TAB,
];
```

通过展开运算符合并为一个扁平数组，供 Root Stack Navigator 遍历注册 `<Stack.Screen>`。

---

## 8. 类型流转总结

```
添加新屏幕的步骤：

1. types.ts
   在对应的 XxxRootParamList 中声明路由名和参数类型
   → RootStackParamList 自动包含
   → RootStackRegisteredScreenName 自动包含

2. rootStackScreenRegistry.tsx
   在对应的 ROOT_STACK_SCREENS_XXX_TAB 数组中添加条目
   → name 必须是 RootStackRegisteredScreenName（编译期检查）
   → component 用 lazyScreen() 包裹实现懒加载
   → ROOT_STACK_SCREEN_REGISTRY 自动包含

3. 导航时
   navigation.navigate('/Market/DailyInspection', { id: '123' })
   → 路由名有类型检查
   → 参数有类型检查
```

类型系统在这里的价值：**路由名拼错或参数不匹配，编译时就会报错**，而不是运行时崩溃。
