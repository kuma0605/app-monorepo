# src/ 总览

SAMRApp 的 `src/` 是一个 React Native 单源代码库，通过平台后缀（`.ios` / `.android` / `.harmony`）实现 iOS、Android、鸿蒙三端差异化，共享同一个 Redux 状态层和路由层。

## 目录结构

```
src/
├── screens/        111 个文件  — 页面（Feature Screens）
├── components/      43 个文件  — 通用 UI 组件
├── navigation/      7 个文件   — 路由导航
├── hooks/           6 个文件   — 全局复用 Hook
├── services/        7 个文件   — API 请求层
├── store/           7 个文件   — Redux 状态管理
├── theme/           4 个文件   — 设计令牌（颜色/间距/字体）
├── utils/           9 个文件   — 工具函数
├── constants/       1 个文件   — 全局常量
├── types/           1 个文件   — 公共 TS 类型
├── native/          1 个文件   — 原生桥接（AsyncStorage 鸿蒙适配）
└── assets/          — 字体/图标/图片（占位）
```

## 10 个架构层

| #   | 层级                 | 职责                                                                |
| --- | -------------------- | ------------------------------------------------------------------- |
| 1   | **Foundation**       | theme / utils / types / constants / native — 最底层，不依赖任何业务 |
| 2   | **State Management** | Redux store + slices + typed hooks                                  |
| 3   | **Services**         | apiClient + 各领域 service                                          |
| 4   | **Hooks**            | usePaginatedList / useFilters / useTheme 等跨业务复用钩子           |
| 5   | **UI Components**    | DaDropdown / FilterListLayout / InfoDetails 等纯展示组件            |
| 6   | **Navigation**       | 路由注册、平台适配的 Stack                                          |
| 7   | **Feature Screens**  | 具体业务页面，组合上面所有层                                        |
| 8   | Build & Tooling      | 构建配置（不进运行时）                                              |
| 9   | Native Platform      | 三端原生工程（不进 JS 运行时）                                      |
| 10  | Documentation        | 文档（不进运行时）                                                  |

## 依赖方向

```
        screens (叶)
      ┌── components ──┐
      ├── hooks ───────┤
      ├── navigation   │  都依赖
      ├── services ────┤
      └── state ───────┘
              │
        foundation (根)
       theme / utils / types / constants / native
```

**规则**：上层的可以依赖下层的，下层的绝不依赖上层的。`foundation` 层是**根**，谁都不依赖；`screens` 层是**叶**，依赖整棵树。数据从根往上输送：根 → 干 → 枝 → 叶。

## 阅读路径

进入这栋楼的电梯顺序：

1. **01-entry.md** — 从 `index.js` 到 App 挂载，理解启动链路
2. **02-state.md** — Redux store 怎么配、怎么用
3. **03-navigation.md** — 页面怎么注册、跳转怎么做
4. **04-services.md** — API 请求怎么分层
5. **05-hooks.md** — 那些"万能 hook"到底干了什么
6. **06-components.md** — UI 组件库的设计思路
7. **07-screens.md** — 业务页面如何组合一切
8. **08-data-flow.md** — 串起来看一个完整请求的生命周期

每一步都有具体代码位置和文件间连线，指向知识图谱里已经标注的节点。
