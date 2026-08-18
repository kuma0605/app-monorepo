# Flat Root Stack 方案与懒加载优化

本文记录项目导航架构的选型讨论过程：从 Flat Root Stack 的优缺点分析，到嵌套 Tab Stack 方案的对比，再到最终通过 `lazyScreen()` 实现懒加载优化的落地方案。

---

## 1. 当前架构：Flat Root Stack

项目采用「扁平根栈」模式——所有业务详情页与 `Auth`、`Main`（底部 Tab）注册在同一层 Root Stack 上：

```text
RootStack (native-stack / JS stack)
├── Auth                        登录页
├── Main                        底部 Tab 容器
│   ├── HomeTab
│   ├── MarketRegTab
│   ├── SmartRegTab
│   └── MeTab
├── /Home/FoodCertificate       首页业务全屏页
├── /Home/FoodUser
├── /Market/DailyInspection     市场监管业务全屏页
├── /Market/...
├── /Me/PersonalInfo            我的业务全屏页
└── /Me/DevDemo
```

所有业务页在 `rootStackScreenRegistry.tsx` 中统一注册，通过 `ROOT_STACK_SCREEN_REGISTRY` 数组映射到 `Stack.Screen`。

### 1.1 优点

| 优点                | 说明                                                   |
| ------------------- | ------------------------------------------------------ |
| **心智模型简单**    | 一个 Navigator，无嵌套层级，路由关系一目了然           |
| **全屏无 Tab 栏**   | 业务页天然覆盖底部 Tab，无需额外处理 `tabBarStyle`     |
| **跨 Tab 导航自由** | 任意 Tab 可 push 任意业务页，不受 Tab 边界限制         |
| **统一的顶栏样式**  | 通过 `defaultSubStackScreenOptions` 一处配置，全局生效 |
| **添加页面简单**    | 只需在 registry 加一条 + `types.ts` 加一个类型即可     |

### 1.2 缺点

| 缺点                   | 说明                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Registry 文件膨胀**  | `rootStackScreenRegistry.tsx` 随页面增长线性膨胀（当前 48 屏，330+ 行）                |
| **启动时全部 require** | 所有屏幕模块在 App 启动时立即求值，增加启动开销（已通过 `lazyScreen` 解决，见第 3 节） |
| **无代码分割**         | 所有页面打包进主 bundle，无法按模块拆分                                                |
| **类型需手动同步**     | registry 与 `types.ts` 的路由定义需保持同步                                            |

---

## 2. 备选方案对比

### 方案 A：Per-Tab Stack（每个 Tab 内嵌 Stack）

React Navigation 官方推荐的模式。每个 Tab 拥有独立的 Stack Navigator：

```text
RootStack
├── Auth
└── Main (Tab Navigator)
    ├── HomeTab → HomeStack (列表 + Tab 内详情)
    ├── MarketRegTab → MarketRegStack
    ├── SmartRegTab → SmartRegStack
    └── MeTab → MeStack
```

**优点**：模块边界清晰，各 Tab 团队自治，回退行为自然。

**缺点**：Tab 内页**无法隐藏底部 Tab 栏**（除非用 `tabBarStyle: { display: 'none' }` hack，且过渡突兀）。

### 方案 B：Tab Stack + Root 全屏 Group

在方案 A 基础上，将需要全屏（隐藏 Tab）的页面提升到 Root Stack：

```text
RootStack
├── Auth
├── Main (Tab Navigator + 各自的 Stack)
└── [全屏业务页 Group]          ← 跨 Tab 或需要全屏的页面
    ├── InspectionDetail
    ├── PersonalInfo
    └── ...
```

**优点**：兼顾 Tab 内导航与全屏需求。

**缺点**：需要判断每个页面属于 Tab Stack 还是 Root Stack，增加决策成本。对于本项目大部分页面都需要全屏无 Tab 的场景，退化后几乎等同于 Flat Root Stack。

### 方案 C：Feature-Based 嵌套 Navigator

按业务域拆分独立 Navigator（检查流程、投诉流程、指令流程等）。

**优点**：适合大型团队、100+ 页面的项目。

**缺点**：样板代码多，当前 48 个页面使用此方案过度设计。

### 对比总结

| 维度       | Flat Root Stack | Per-Tab Stack   | Tab + Root Group | Feature-Based  |
| ---------- | --------------- | --------------- | ---------------- | -------------- |
| 复杂度     | ⭐ 低           | ⭐⭐ 中         | ⭐⭐ 中          | ⭐⭐⭐ 高      |
| Tab 栏隐藏 | ✅ 天然         | ⚠️ 需 hack      | ✅ Root 层天然   | ✅ Root 层天然 |
| 适合规模   | < 60 页         | < 100 页        | < 100 页         | 100+ 页        |
| 本项目适配 | ✅ 最佳         | ❌ 多数页需全屏 | ⚠️ 退化等同      | ❌ 过度设计    |

**结论**：对于当前项目（48 屏、多数页面需全屏无 Tab），Flat Root Stack 是最务实的选择。核心问题——启动时全量 require——可以通过懒加载解决。

---

## 3. 懒加载优化：`lazyScreen()`

### 3.1 问题

原始 registry 中每个屏幕使用 eager `require()`：

```tsx
// 启动时立即求值——48 个模块全部在 App 启动时执行
component: require('@/screens/Home/FoodCertificate').default as RootStackScreen,
```

虽然 Hermes 字节码预编译大幅降低了 JS 解析开销，但 48 个模块的顶层代码（import、函数定义、类声明）仍在启动时同步执行，估计增加 **100–400ms** 启动耗时（中端 Android 设备）。

### 3.2 方案演进

**第一步：Getter 函数**

将 `require()` 包裹在箭头函数中，延迟到首次导航时执行：

```tsx
component: () =>
  require('@/screens/Home/FoodCertificate').default as RootStackScreen,
```

问题：React Navigation 检测到箭头函数，输出警告：

> Looks like you're passing an inline function for 'component' prop...

**第二步：`lazyScreen()` 命名包装器**

引入 `lazyScreen()` 辅助函数，返回大写开头的命名函数组件：

```tsx
function lazyScreen(getter: () => RootStackScreen): RootStackScreen {
  function LazyScreen(props: Record<string, unknown>) {
    const Cmp = getter();
    return (Cmp as Function)(props) as React.ReactElement;
  }
  return LazyScreen as unknown as RootStackScreen;
}
```

使用方式：

```tsx
component: lazyScreen(() =>
  require('@/screens/Home/FoodCertificate').default as RootStackScreen),
```

### 3.3 为什么有效

| 机制           | 说明                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| **延迟求值**   | `require()` 包裹在 `getter` 中，只在 `LazyScreen` 首次被 React 渲染时执行            |
| **Metro 缓存** | `require()` 结果被 Metro 模块系统缓存，后续调用瞬间返回                              |
| **命名函数**   | `LazyScreen` 首字母大写，React Navigation 的 inline-function 检查通过                |
| **稳定引用**   | `lazyScreen()` 在模块顶层调用一次，返回的 `LazyScreen` 引用不变，不会导致 state 丢失 |

### 3.4 验证方法

在目标屏幕模块的顶层添加 `Alert.alert()`（RNOH 平台无 console 输出，用 Alert 替代）：

```tsx
// src/screens/Me/PersonalInfo/index.tsx
import {Alert} from 'react-native';
Alert.alert('[TEST]', 'PersonalInfo module evaluated');
```

| 版本                 | Alert 弹出时机                   |
| -------------------- | -------------------------------- |
| 原始 eager `require` | App 启动后立即弹出               |
| `lazyScreen` 版本    | 仅在首次导航到「个人信息」时弹出 |

实测验证：`lazyScreen` 方案确实将模块求值延迟到了首次导航时，启动阶段不再执行任何业务屏幕模块。

### 3.5 涉及文件

| 文件                                         | 变更                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/navigation/rootStackScreenRegistry.tsx` | 添加 `lazyScreen()` 辅助函数，所有 48 个屏幕改用 `lazyScreen(() => require(...))` |
| `src/navigation/rootStack.tsx`               | `component` prop 添加 `as any` 类型断言                                           |
| `src/navigation/rootStack.harmony.tsx`       | 同上                                                                              |

---

## 4. 新增页面规范

添加新的 Root 级全屏业务页时，按以下步骤操作：

### 4.1 在 `types.ts` 中添加路由类型

```tsx
export type MarketRegRootParamList = {
  // ...existing routes
  '/Market/NewScreen': RootBusinessRouteParams; // 新增
};
```

### 4.2 在 `rootStackScreenRegistry.tsx` 中注册

```tsx
{
  name: '/Market/NewScreen',
  component: lazyScreen(() =>
    require('@/screens/MarketReg/newScreen').default as RootStackScreen),
  options: {title: '新页面标题'},
},
```

### 4.3 导航

```tsx
navigation.navigate('/Market/NewScreen', {id: '123'});
```

> **注意**：始终使用 `lazyScreen()` 包裹，避免退回 eager require 导致启动变慢。
