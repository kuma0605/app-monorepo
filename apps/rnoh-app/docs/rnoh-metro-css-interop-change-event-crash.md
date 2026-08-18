# RNOH + NativeWind：修改文件触发 Metro 崩溃（`addedFiles` / `isSymlink`）

## 现象

在使用 HarmonyOS 的 React Native OpenHarmony（RNOH）并集成 NativeWind/Tailwind（`withNativeWind` + `global.css`）时，**只要改动 `App.tsx`（或触发 CSS 相关更新）就可能导致 Metro 直接崩溃**。

常见报错 1（DependencyGraph）：

```text
/node_modules/metro/src/node-haste/DependencyGraph.js:99
      ...changes.addedFiles,
                 ^

TypeError: Cannot read properties of undefined (reading 'addedFiles')
    at DependencyGraph._onHasteChange (.../node_modules/metro/src/node-haste/DependencyGraph.js:99:18)
    ...
    at Object.onChange (.../node_modules/react-native-css-interop/dist/metro/index.js:181:19)
    at ChildProcess.<anonymous> (.../node_modules/@react-native-ohos/nativewind/dist/metro/tailwind/v3/index.js:53:37)
```

常见报错 2（DeltaCalculator）：

```text
/node_modules/metro/src/DeltaBundler/DeltaCalculator.js:100
    if (metadata.isSymlink) {
                 ^

TypeError: Cannot read properties of undefined (reading 'isSymlink')
    at #shouldReset (.../node_modules/metro/src/DeltaBundler/DeltaCalculator.js:100:18)
    at FileMap._handleMultipleFileChanges (.../node_modules/metro/src/DeltaBundler/DeltaCalculator.js:130:28)
    ...
    at Object.onChange (.../node_modules/react-native-css-interop/dist/metro/index.js:185:19)
```

环境示例：

- `react-native`: `0.82.1`
- `@react-native-ohos/nativewind`: `4.1.24`
- `react-native-css-interop`: `npm:@react-native-ohos/react-native-css-interop@^0.1.24`
- Node: `v22.17.1`

## 根因分析

NativeWind（OHOS 版本）通过 `react-native-css-interop` 启动 Tailwind 处理子进程，生成（或虚拟）平台 CSS/JS 输出，并在更新时通过 `haste.emit("change", payload)` 触发 Metro 重新打包/热更新。

问题在于：**`react-native-css-interop` 发出的 change 事件 payload 格式与 RN 0.82+ 的 Metro 期望不一致**。

### Metro 0.82+ 对 change 事件的期望

Metro 的 `DeltaCalculator`/`DependencyGraph` 会从事件中解构：

- `rootDir: string`
- `changes: { addedFiles, modifiedFiles, removedFiles }`

并且 `changes.*Files` 的元素是二元组：

`[canonicalPath, metadata]`

其中 `metadata` 至少需要满足（见 `metro-file-map` 类型定义）：

- `isSymlink: boolean`
- `modifiedTime?: number`

当 payload 不满足上述结构时：

- 如果 `changes` 不存在 → 报错 `reading 'addedFiles'`
- 如果 `modifiedFiles` 里缺少 metadata → 报错 `reading 'isSymlink'`

### 为什么“改 App.tsx”也会触发

NativeWind 的 Tailwind watch/processor 会在文件变化时触发一次 “虚拟模块” 更新，并向 Metro 发出 change 事件。即使你改的是 `App.tsx`，只要 NativeWind 的链路启动并触发更新，就可能走到 `react-native-css-interop` 的 `haste.emit("change", ...)`。

## 解决方案：用 `patch-package` 修复 change 事件 payload

由于 `@react-native-ohos/react-native-css-interop` 目前只发布到 `0.1.24`，没有已修复的新版本可升级，因此采用 `patch-package` 在项目内打补丁是最直接可控的方案。

### 1）修改点（补丁内容）

文件：

- `node_modules/react-native-css-interop/dist/metro/index.js`

将旧的 `{ eventsQueue: [...] }` payload 替换为 Metro 0.82+ 兼容的 `{ rootDir, changes }`，并补齐 `metadata.isSymlink`：

```js
const rootDir = process.cwd();
const canonicalPath = path.relative(rootDir, filePath);
const metadata = {isSymlink: false, modifiedTime: Date.now()};

haste.emit('change', {
  rootDir,
  changes: {
    addedFiles: [],
    modifiedFiles: [[canonicalPath, metadata]],
    removedFiles: [],
  },
});
```

> 说明：`canonicalPath` 必须是相对 `rootDir` 的路径；`metadata.isSymlink` 必须存在，否则会在 `DeltaCalculator.#shouldReset` 崩溃。

### 2）生成补丁文件

在项目根目录执行：

```bash
npx patch-package react-native-css-interop
```

会生成：

- `patches/react-native-css-interop+0.1.24.patch`

注意：如果补丁里混入了 `node_modules/react-native-css-interop/.cache/*` 等运行时产物，需要先删除这些产物并重新生成补丁，确保补丁只包含 `dist/metro/index.js` 的改动。

### 3）确保安装后自动应用补丁

在 `package.json` 添加：

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

## 验证方式

1. 关闭所有 Metro 进程
2. 重新启动 Metro（建议 reset cache）：

```bash
npm start -- --reset-cache
```

3. 修改 `App.tsx` 或 `global.css` 触发更新，观察 Metro 不再出现：

- `reading 'addedFiles'`
- `reading 'isSymlink'`

## 相关备注：`EMFILE: too many open files, watch`

如果看到 Metro 启动后立刻报：

```text
Error: EMFILE: too many open files, watch
```

这属于 **文件监听句柄耗尽** 的另一个问题，与本补丁无关。一般建议：

- 优先使用 watchman（Metro 默认 `useWatchman: true`）
- 根据 Metro 输出提示执行一次 watchman 重置（示例）：

```bash
watchman watch-del '/Users/dylan/CodeHub/SAMRApp'
watchman watch-project '/Users/dylan/CodeHub/SAMRApp'
```

## 什么时候可以不装 `@react-native-ohos/react-native-css-interop`

如果项目 **不使用 NativeWind/Tailwind（不走 `withNativeWind`，也不引入 `global.css`）**，则可以移除相关依赖与配置。

但只要继续使用 `@react-native-ohos/nativewind` 的 Metro 集成，一般就需要 `react-native-css-interop`（或等上游提供替代实现/修复版本）。
