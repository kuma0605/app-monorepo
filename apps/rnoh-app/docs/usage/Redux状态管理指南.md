# Redux Toolkit & State Management Guide

本文档介绍 `MARSApp` 中使用的状态管理方案：**Redux Toolkit (RTK)** 与 **Redux Persist**。

---

## 1. 核心概念：为什么叫 "Slice" (切片)？

在 Redux 中，整个应用的状态（State）被存储在一个单一的、巨大的对象树中（称为 **Store**）。你可以把它想象成一个**巨大的蛋糕**。

- **Slice 的含义**：由于“蛋糕”太大，直接维护很不方便，我们将它**切成一小块一小块**。每一块（Slice）负责应用的一个特定功能模块（如：用户模块、设置模块）。
- **Slice 的组成**：一个 Slice 包含了该功能的**初始数据**、**修改数据的逻辑 (Reducers)** 以及**触发修改的指令 (Actions)**。
- **最终组合**：我们编写多个 Slice，最后通过 `combineReducers` 把它们重新“拼”成完整的 Store。

---

## 2. 核心组件说明

### Redux Toolkit (RTK)

官方推荐的工具集，解决了传统 Redux 样板代码过多的问题。

- **`createSlice`**: 定义逻辑的核心函数。
- **`useAppSelector`**: (自定义 Hook) 用于从 Store 中读取数据。
- **`useAppDispatch`**: (自定义 Hook) 用于发送指令修改数据。

### Redux Persist

负责将 Redux 中的状态**自动持久化**到手机本地存储（`AsyncStorage`）。

- **作用**：即使用户杀死 App 重新打开，被持久化的状态（如登录 Token）依然存在，无需重新登录。
- **配置**：在 `src/store/index.ts` 的 `persistConfig` 中配置。

---

## 3. 使用指南

### 3.1 如何读取数据 (Read)

使用 `useAppSelector` 钩子，它具备完整的 TypeScript 类型推导。

```tsx
import {useAppSelector} from '../store/hooks';

const UserProfile = () => {
  // 从 user 切片中获取数据
  const {name, isLoggedIn} = useAppSelector(state => state.user);

  return <Text>{isLoggedIn ? `欢迎, ${name}` : '未登录'}</Text>;
};
```

### 3.2 如何修改数据 (Write)

1. 从对应的 Slice 文件中导入 **Action**。
2. 使用 `useAppDispatch` 获取 `dispatch` 函数。
3. 调用 `dispatch(action(payload))`。

```tsx
import {useAppDispatch} from '../store/hooks';
import {login} from '../store/slices/userSlice';

const LoginComp = () => {
  const dispatch = useAppDispatch();

  const handleLogin = () => {
    dispatch(login({name: 'Dylan', accessToken: 'xyz_123'}));
  };

  return <Button title="登录" onPress={handleLogin} />;
};
```

### 3.3 如何新增一个状态切片 (Slice)

假设你要新增一个“设置中心”模块，步骤如下：

#### 第一步：创建 Slice 文件

在 `src/store/slices/` 下新建 `settingsSlice.ts`：

```typescript
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface SettingsState {
  theme: 'light' | 'dark';
  isNotificationEnabled: boolean;
}

const initialState: SettingsState = {
  theme: 'light',
  isNotificationEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // 切换主题的 Action
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    // 切换通知开关
    toggleNotifications: state => {
      state.isNotificationEnabled = !state.isNotificationEnabled;
    },
  },
});

export const {setTheme, toggleNotifications} = settingsSlice.actions;
export default settingsSlice.reducer;
```

#### 第二步：在 Store 中注册

打开 `src/store/index.ts`，将新的 reducer 加入 `rootReducer`：

```typescript
import settingsReducer from './slices/settingsSlice'; // 1. 引入

const rootReducer = combineReducers({
  user: userReducer,
  settings: settingsReducer, // 2. 注册
});
```

#### 第三步：(可选) 配置持久化

如果你希望用户选的主题在下次打开 App 时依然生效，将其加入 `whitelist`：

```typescript
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'settings'], // 3. 加入白名单
};
```

---

## 4. 目录结构

- `src/store/index.ts`: Store 的核心配置（包含持久化逻辑）。
- `src/store/hooks.ts`: 定义了类型化的 `useAppSelector` 和 `useAppDispatch`。
- `src/store/slices/`: 存放所有的业务逻辑切片。

---

## 5. 常见问题 (FAQ)

**Q: 我修改了代码，为什么状态没重置？**
A: 因为使用了 Redux Persist。如果你想强制清空本地缓存，可以临时调用 `persistor.purge()` 或者在开发阶段清理 App 缓存/卸载重装。

**Q: 哪些数据应该放进 Redux？**
A: 多个页面需要共享的数据（如用户信息、主题配置、全局加载状态）。如果是仅在单个页面使用的临时数据，建议使用组件内部的 `useState`。
