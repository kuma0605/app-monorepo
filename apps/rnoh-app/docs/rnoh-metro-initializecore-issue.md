# RNOH Metro InitializeCore Issue

## Summary

在 React Native 0.82 + RNOH 0.82 项目中，Android 虚拟机启动时报错：

```text
ReferenceError: Property 'window' doesn't exist, stack:
anonymous@52901:26
loadModulelmplementation@275:13
guardedLoadModule@182:37
metroRequire@96:91
anonymous@52873:68
loadModulelmplementation@275:13
guardedLoadModule@182:37
metroRequire@96:91
anonymous@52231:82
loadModulelmplementation@275:13
guardedLoadModule@182:37
metroRequire@96:91
anonymous@52218:42
loadModulelmplementation@275:13
guardedLoadModule@182:37
metroRequire@96:91
anonymous@52133:56
loadModulelmplementation@275:13
guardedLoadModule@175:46
metroRequire@96:91 anonymous@51963:41
runApplication@52009:21
```

Harmony/OpenHarmony 运行正常。问题不是业务代码直接访问了 `window`，而是 Metro 配置合并后，Android/iOS 丢失了 React Native 默认的运行时初始化模块。

## Environment

- React Native: `0.82.1`
- RNOH: `@react-native-oh/react-native-harmony@0.82.23`
- Metro: `0.83.6`
- Affected platforms: Android and potentially iOS
- Unaffected platform: Harmony/OpenHarmony

## Symptom

Android bundle 在运行时进入 React Native 调试相关模块时，触发如下代码：

```js
var reactDevToolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
```

但 Android Hermes 环境默认没有浏览器全局对象 `window`，需要 React Native 的 `InitializeCore` 先执行，内部会通过 `setUpGlobals` 设置：

```js
global.window = global;
```

出错时 Android bundle 底部只有：

```js
__r(0);
```

这表示 Metro 直接运行了 `index.js`，没有先运行 `InitializeCore`。

## Root Cause

`metro.config.js` 同时合并了 React Native 默认 Metro 配置和 RNOH Metro 配置：

```js
mergeConfig(
  getDefaultConfig(__dirname),
  createHarmonyMetroConfig(...),
  config
)
```

React Native 默认配置中包含：

```js
serializer: {
  getModulesRunBeforeMainModule: () => [
    require.resolve("react-native/Libraries/Core/InitializeCore"),
  ],
}
```

RNOH 配置中也定义了同名字段：

```js
serializer: {
  getModulesRunBeforeMainModule: () => {
    if (REQUEST_RESOLUTION_LATEST_PLATFORM !== 'harmony') {
      return [];
    }
    return [require.resolve('./Libraries/Core/InitializeCore')];
  },
}
```

`mergeConfig` 遇到同名函数时不会把两个函数智能合并，而是后面的配置覆盖前面的配置。因此 RNOH 的 `getModulesRunBeforeMainModule` 覆盖了 React Native 默认值。

结果是：

- Harmony 平台返回 RNOH 的 `InitializeCore`，所以正常。
- Android/iOS 平台返回空数组，导致 RN 默认的 `InitializeCore` 没有预先执行。
- RN 0.82 的调试/渲染链路较早访问 `window`，因此 Android 暴露该错误。

## Why Older RNOH 0.77 Projects May Work

RNOH 0.77 的 Metro 配置也存在类似逻辑，但 RN 0.77 的运行时代码链路可能没有这么早触发对 `window` 的顶层访问。因此 0.77 项目即使有相同配置，也可能没有暴露问题。

这更像是版本组合差异导致的潜在配置问题显性化，而不是业务代码回归。

## Fix

在 `metro.config.js` 中保留两个初始化函数：

- Harmony 平台优先使用 RNOH 返回的初始化模块。
- 非 Harmony 平台如果 RNOH 返回空数组，则回退到 React Native 默认初始化模块。

修复后的行为：

```text
Harmony -> RNOH InitializeCore
Android -> React Native InitializeCore
iOS     -> React Native InitializeCore
```

验证 Android bundle 后，底部应出现：

```js
__r(<InitializeCore module id>);
__r(0);
```

这表示 `InitializeCore` 会在 `index.js` 前执行。

## Verification

重新启动 Metro 并清缓存：

```bash
npx react-native start --reset-cache
```

另开终端运行 Android：

```bash
npm run android
```

也可以直接打包检查：

```bash
npx react-native bundle \
  --platform android \
  --dev true \
  --entry-file index.js \
  --bundle-output /tmp/SAMRApp.android.bundle
```

检查 bundle 底部，确认 `InitializeCore` 在 `index.js` 前执行。

## Notes

这个修复不是给 Android 手动添加 `window` polyfill，而是恢复 React Native 正常的初始化顺序。这样可以避免掩盖其他 RN 运行时初始化逻辑缺失的问题。

---

## 2026-06-05 补充更新：Metro 缓存导致的 `WebSocket` 不存在错误 (ReferenceError: Property 'WebSocket' doesn't exist)

### 新现象

在 Metro 服务启动后，如果在开发鸿蒙应用后切换回安卓虚拟机开发，并在 Metro 控制台按 `r` 重载，安卓虚拟机会报错：

```text
[runtime not ready]: ReferenceError: Property 'WebSocket' doesn't exist, stack:
createSocket@287112:17
connect@288236:33
...
```

这在配置了 Reactotron 调试工具（依赖 WebSocket）的项目中尤其明显。

### 新原因分析

之前的修复逻辑为：

```javascript
getModulesRunBeforeMainModule: () => {
  const harmonyModules = getHarmonyModulesRunBeforeMainModule?.() ?? [];
  if (harmonyModules.length > 0) {
    return harmonyModules;
  }
  return getDefaultModulesRunBeforeMainModule?.() ?? [];
};
```

该逻辑依赖 `@react-native-oh/react-native-harmony` 内部定义的 `getHarmonyModulesRunBeforeMainModule`。而该方法内部通过判断全局/模块级变量 `REQUEST_RESOLUTION_LATEST_PLATFORM === 'harmony'` 来决定是否返回鸿蒙版 `InitializeCore`。

**致命缓存 Bug**：

1. `REQUEST_RESOLUTION_LATEST_PLATFORM` 仅在 Metro 执行模块解析 `resolveRequest` 时更新。
2. 当你在控制台按 `r` 重载 Android 模拟器时，由于 Metro 使用了大量**内存缓存**，依赖图已经解析完毕，解析钩子 `resolveRequest` **不会**被触发。
3. 此时变量 `REQUEST_RESOLUTION_LATEST_PLATFORM` 仍保留着上次的值（即 `'harmony'`）。
4. 导致 `getHarmonyModulesRunBeforeMainModule` 返回了鸿蒙的 `InitializeCore` 数组。
5. Android bundle 因此打包了鸿蒙的 `InitializeCore`。鸿蒙的 `InitializeCore` 不含标准 React Native 的 `WebSocket` 等 polyfill，导致报错。

### 终极修复方案

在 `metro.config.js` 中引入 Node.js 的 `AsyncLocalStorage`，并配合解析器劫持，实现**请求级别（Request-scoped）**和**编译级别（CLI-scoped）**的平台精准跟踪：

1. **对于 Dev Server 请求（请求级别）**：
   通过 Metro 的 `server.enhanceMiddleware` 拦截所有的 HTTP 请求，解析 URL 中的 `?platform=...` 参数，并使用 `AsyncLocalStorage` 维护当前的平台上下文。
2. **对于 CLI 打包命令（编译级别）**：
   劫持 `resolveRequest`，将解析过程中的最新平台记录到 `latestPlatform` 中作为备用。
3. **最终获取**：
   在 `getModulesRunBeforeMainModule` 中，优先通过 `AsyncLocalStorage` 获取准确的平台，如果不存在（如 CLI 构建），则降级使用 `latestPlatform`。

**修改后的 `metro.config.js` 关键部分**：

```javascript
const {AsyncLocalStorage} = require('async_hooks');
const platformStorage = new AsyncLocalStorage();
let latestPlatform = null;

// 1. 劫持 resolveRequest 记录最新解析平台（适用于 cold build / CLI 打包）
const originalResolveRequest = mergedConfig.resolver.resolveRequest;
if (originalResolveRequest) {
  mergedConfig.resolver.resolveRequest = (ctx, moduleName, platform) => {
    latestPlatform = platform;
    return originalResolveRequest(ctx, moduleName, platform);
  };
}

// 2. 增强中间件在请求生命周期中绑定平台上下文（适用于 Dev Server 热更新与重载）
const originalEnhanceMiddleware = mergedConfig.server?.enhanceMiddleware;
mergedConfig.server = {
  ...mergedConfig.server,
  enhanceMiddleware: (middleware, server) => {
    const enhanced = originalEnhanceMiddleware
      ? originalEnhanceMiddleware(middleware, server)
      : middleware;

    return (req, res, next) => {
      let platform = null;
      if (req.url) {
        const urlMatch = req.url.match(/[?&]platform=([^&]+)/);
        if (urlMatch) {
          platform = urlMatch[1];
        }
      }

      if (platform) {
        return platformStorage.run(platform, () => {
          return enhanced(req, res, next);
        });
      }
      return enhanced(req, res, next);
    };
  },
};

// 3. 根据准确的平台直接 resolve 对应的 InitializeCore 模块，彻底摆脱外部全局状态干扰
mergedConfig.serializer = {
  ...mergedConfig.serializer,
  getModulesRunBeforeMainModule: entryPoint => {
    const platform = platformStorage.getStore() || latestPlatform;
    if (platform === 'harmony') {
      return [
        require.resolve(
          '@react-native-oh/react-native-harmony/Libraries/Core/InitializeCore',
        ),
      ];
    }
    return [require.resolve('react-native/Libraries/Core/InitializeCore')];
  },
};
```
