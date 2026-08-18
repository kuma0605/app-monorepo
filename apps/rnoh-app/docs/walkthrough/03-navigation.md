# 03 — 导航：页面怎么注册和跳转

## 路由架构

```
rootStackScreenRegistry.tsx   ← 唯一注册表（lazy 注册 ~17 个顶级屏幕）
        ↓
  ┌─────┴─────┐
  ↓           ↓
rootStack.tsx  rootStack.harmony.tsx
(iOS/Android)  （鸿蒙，额外关闪屏）
        ↓
  子页面栈（SubStack）
```

## 屏幕注册表

`src/navigation/rootStackScreenRegistry.tsx` 是整个 App 的**目录大堂**：

- 用 `React.lazy()` 注册所有顶级屏幕
- 屏幕被真正打开时才加载 JS bundle，首屏不卡顿
- 新增页面？在这一个文件里加一行

注册的屏幕覆盖：

| 模块      | 屏幕                                                 |
| --------- | ---------------------------------------------------- |
| Home      | 首页（7 个待办入口：药品/食品/知识产权/特设/预警等） |
| MarketReg | 企业、投诉、检查、健康证、指令、医疗器械、药品、纺织 |
| SmartReg  | 业务数据、投诉、检查、健康证、指令、订单             |
| Me        | 个人中心                                             |
| Demo      | 日历、图表、文件选择、文档选择等调试页               |

## 平台差异处理

| 文件                       | 平台        | 差异              |
| -------------------------- | ----------- | ----------------- |
| `rootStack.tsx`            | iOS/Android | 标准根栈          |
| `rootStack.harmony.tsx`    | 鸿蒙        | 挂载后隐藏闪屏    |
| `devDemoStack.tsx`         | iOS/Android | Demo 栈           |
| `devDemoStack.harmony.tsx` | 鸿蒙        | Demo 栈（鸿蒙版） |

**规则**：平台差异用文件后缀（`.harmony.tsx` / `.android.tsx` / 默认 iOS）解决，不用 `if (Platform.OS === 'harmony')` 写满屏幕。

## 子页面统一风格

| 文件                               | 作用                               |
| ---------------------------------- | ---------------------------------- |
| `defaultSubStackScreenOptions.tsx` | 子页面默认样式（标题、背景、动画） |
| `SubStackHeaderBack.tsx`           | 子页面返回按钮统一样式             |

所有子页面共享同一套外观，改这两个文件就能全局换皮。

## 跳转怎么做

```tsx
// 在屏幕组件里
import {useNavigation} from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('CompanyDetail', {id: 123});
```

路由类型定义在 `src/navigation/types.ts`，写了每个路由的参数类型，写错参数名会红线。

## 导航与状态的关系

导航层**不持有业务数据**。它只管"显示哪个屏幕、传什么参数"。数据都在 Redux store 里：

```
屏幕 A → navigate('B', { id }) → 屏幕 B
屏幕 B → useAppSelector(selectXxxById) → 从 store 拿数据
```

屏幕之间不直接传业务对象，只传 id，各自从 store 查。这样屏幕 B 被 deeplink 打开时也能独立工作。
