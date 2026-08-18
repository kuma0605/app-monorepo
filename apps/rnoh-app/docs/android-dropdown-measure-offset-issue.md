# React Native Android 平台下拉筛选弹窗定位与导航模式差异总结

## 1. 问题背景与演进

### 第一阶段：Native Stack + 默认状态栏

- **现象**：在 Android 设备上使用原生栈（`createNativeStackNavigator`）且状态栏为非沉浸式（`translucent={false}`）时，点击筛选条件（如“待办类型”），弹出的下拉菜单与筛选栏之间存在高度正好等于**系统状态栏高度**的空白间隙。
- **原因**：由于使用原生导航栏，React Native 视图渲染在原生状态栏下方开始（Portal 容器 top: 0 的物理屏幕位置为 `Y = statusBarHeight`），而 `.measure()` 计算出的 Y 坐标是相对于设备物理最顶端（`Y = 0`）的值。因此绝对定位偏下了一个状态栏高度，产生空隙。
- **临时方案**：在 Android 平台特判减去 `StatusBar.currentHeight`，进行坐标补偿，完美贴合。

---

### 第二阶段：探索 Native Stack 底部间隙修复（切换 JS Stack）

- **新问题**：Android 端的非 Tab 原生栈页面底部出现了一块空白遮挡（类似被隐藏的 TabBar 留白），这是 `react-native-screens` 原生层在 Android 上的 safe-area 传递 Bug。
- **解决办法**：将 Android 端的根 Stack 导航由原生栈 `createNativeStackNavigator` 切换为了 JS 栈 `createStackNavigator`（与鸿蒙端的配置对齐）。

---

### 第三阶段：JS Stack 模式下的坐标冲突与修正

- **现象**：将导航切换为 JS Stack 后，发现原本好好的 Android 下拉筛选菜单**突然往上移，直接盖住了筛选栏本身**。
- **原因分析**：
  - **在 JS Stack 模式下**，整个页面的 Header 均在 JavaScript 层渲染，React Native 控制的屏幕视口（Viewport）及 `Portal.Host` 绝对定位起点发生了变化（其定位原点与设备最顶端重合 `Y = 0`）。
  - 此时 `.measure()` 测量得到的 `bPageY` 坐标同样也是从设备顶端开始的绝对坐标，即两者在同一个参考系下。
  - 如果在此模式下依然强行在 Android 端减去 `StatusBar.currentHeight`，就会导致绝对定位被**扣除过多**，整个弹层往上蹿，恰好盖住了筛选栏。
- **最终统一方案**：
  - 移除 Android 平台的特判逻辑，不再减去状态栏高度。
  - 无论 Android、HarmonyOS 还是 iOS，全部统一使用标准绝对高度计算定位：
    ```typescript
    const barBottomWin = bPageY + bh;
    ```
  - 这不仅解决了重合盖住筛选栏的问题，也简化了跨端定位的实现。

---

## 2. 核心经验与规律总结

| 导航模式 \ 状态栏模式                             | 非沉浸式状态栏 (translucent=false)                                                                        | 沉浸式状态栏 (translucent=true)                             |
| :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| **Native Stack** <br>`createNativeStackNavigator` | Portal 定位需**减去状态栏高度**，否则产生向下空隙。                                                       | Portal 与 Viewport 坐标系重合，定位**无需减去状态栏高度**。 |
| **JS Stack** <br>`createStackNavigator`           | Portal 与 Viewport 坐标系完全一致，定位**无需减去状态栏高度**（因整个渲染层级受 React Native 统一控制）。 | Portal 与 Viewport 坐标系重合，定位**无需减去状态栏高度**。 |

> [!IMPORTANT] > **黄金法则**：在跨端 React Native 开发中，如果页面已经迁移到了 JS Stack 或者统一采用了全屏/沉浸式方案，绝对定位弹层（如 Portal 浮层）的坐标系就会天然与 `.measure()` 的返回值对齐。此时**千万不要引入特定平台的 `StatusBar.currentHeight` 减法补偿**，否则在 JS 栈页面中会导致弹窗上移遮挡触发按钮。
