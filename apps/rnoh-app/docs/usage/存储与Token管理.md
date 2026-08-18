# Token 存储与持久化指南

本文档介绍如何在 React Native (RNOH) 项目中处理 Token 的持久化存储、读取以及自动登录逻辑。

---

## 1. 核心概念：内存 vs 持久化存储

在处理登录状态时，需要配合使用两种存储方式：

| 存储类型              | 常用工具                     | 生命周期                       | 用途                               |
| :-------------------- | :--------------------------- | :----------------------------- | :--------------------------------- |
| **运行时内存 (RAM)**  | React Context / Redux / 变量 | App 进程运行时                 | 供网络请求即时调用，响应速度极快。 |
| **持久化存储 (Disk)** | AsyncStorage / Keychain      | 永久存在（除非卸载或清除数据） | 跨启动保存登录状态，实现自动登录。 |

---

## 2. 使用 AsyncStorage (基础方案)

项目中已集成 `@react-native-ohos/async-storage`，适用于大部分普通 App。

### 登录成功：保存 Token

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const saveToken = async token => {
  try {
    await AsyncStorage.setItem('user_token', token);
  } catch (e) {
    console.error('存储 Token 失败', e);
  }
};
```

### App 启动：读取与自动登录

在 `App.tsx` 或根路由初始化时执行：

```javascript
useEffect(() => {
  const initAuth = async () => {
    const token = await AsyncStorage.getItem('user_token');
    if (token) {
      // 1. 将 Token 存入全局状态 (如 AuthContext)
      setAuthToken(token);
      // 2. 路由跳转至首页
    } else {
      // 跳转至登录页
    }
  };
  initAuth();
}, []);
```

---

## 3. 安全性增强 (进阶方案)

如果 Token 涉及高价值权限或敏感信息，建议使用硬件级加密存储。

- **推荐库**：`react-native-keychain`
- **鸿蒙底层实现**：该库在鸿蒙端会调用 **HUKS (HarmonyOS Universal KeyStore)**。
- **优点**：即使手机被 Root，攻击者也难以通过直接读取文件的方式窃取被加密的 Token。

---

## 4. 推荐工作流

1.  **用户登录** -> 获取 Token。
2.  **持久化** -> 调用 `AsyncStorage.setItem`。
3.  **内存同步** -> 将 Token 写入全局 Context 变量。
4.  **接口调用** -> 从 Context 中读取 Token 放入 Header。
5.  **用户退出** -> 清除 `AsyncStorage` 并在全局状态中将 Token 设为 null。

---

## 5. 推荐方案：使用 Redux Toolkit + Redux Persist

对于复杂的应用状态（如用户信息、多项配置），本项目推荐使用已集成的 **Redux Toolkit**。它不仅管理内存状态，还通过插件自动处理了 `AsyncStorage` 的读写逻辑。

👉 **[查看 Redux Toolkit 使用指南](Redux-Toolkit-Guide.md)**

---

## 6. 常见问题 (FAQ)

**Q: 为什么不每次请求都去读 AsyncStorage？**
A: `AsyncStorage` 是异步的且涉及跨原生层调用（读写磁盘），频繁调用会产生不必要的性能开销。推荐在启动时读取一次存入变量，后续直接使用变量。

**Q: 鸿蒙端有特殊配置吗？**
A: 使用 `@react-native-ohos/async-storage` 即可。它已经针对鸿蒙的文件系统进行了适配，使用方式与标准 React Native 完全一致。
