# 鸿蒙与安卓文件选择与预览补丁集成与排错指南

本文记录了在 SAMRApp 中，为在 **HarmonyOS** 与 **Android** 平台上能够稳定、正常地进行文件选择（`react-native-document-picker`）与文件预览（`react-native-file-viewer`）所做的全部补丁改动、构建机制以及排错方案。

---

## 1. 鸿蒙端 (HarmonyOS) 改动与重打包机制

由于在 HarmonyOS (RNOH) 环境下，`DocumentPicker` 与 `FileViewer` 的原生依赖是通过本地静态链接库 `.har` 文件引入的，直接修改 `node_modules` 源码在构建时不会生效，因此我们引入了补丁以及配套的 `.har` 重打包脚本。

### 1.1 补丁清单及作用

1. **`@react-native-ohos+react-native-document-picker+9.3.2.patch`**

   - **保留原始临时 URI 授权：** 将获取文件的 `uri` 返回逻辑从直接返回沙箱文件路径 `fUri.path`，修正在保留临时授权的 `uri`（`file://docs/storage/...`）。
   - **安全 ASCII 磁盘文件名：** 复制文件副本时，将可能含有中文字符或特殊字符的文件名强制命名为 `picked.{ext}`（例如 `picked.pdf`），规避了鸿蒙预览组件 PreviewKit 在非 ASCII 文件名下静默失败的问题。
   - **只读流复制支持：** 修正流式读取权限（解决只读文件在 `'r+'` 打开时报 `13900002` 错误，统一改用 `'r'` 模式）。

2. **`@react-native-ohos+react-native-file-viewer+2.3.0-beta.2.patch`**

   - **外部路径转换与沙箱识别：** 增强原生端对外部存储路径的匹配，自动规整为 `file://docs/storage/...` 格式以契合鸿蒙 PreviewKit 的输入要求。
   - **严格的错误回调：** 废除了 PreviewKit 失败后直接 Fallback 到 `startAbility`（打开方式）导致 JS 层 Promise 误成功的问题；当沙箱路径预览失败时会派发错误并 reject 异步 Promise。
   - **权限持久化：** 在预览非应用内沙箱文件时，自动先进行 `fileShare.persistPermission` 持久化读写权限操作。

3. **`@react-native-ohos+react-native-fs+2.22.0-beta.3.patch`**
   - 修复 `react-native-fs` 文件路径前缀正则匹配逻辑，避免其在鸿蒙端误截断 `file://media/` 路径前缀（仅在 `isHarmony` 且以 `file://media/` 开头时保持原样）。

### 1.2 `.har` 重打包机制

- **核心原理：** 运行 `npm install` 自动触发本地 `postinstall` 钩子：`patch-package && bash scripts/repack-ohos-hars.sh`。
- **脚本行为：** `repack-ohos-hars.sh` 将会解压 `node_modules` 下对应的 `.har` 包，将已被 `patch-package` 修补过后的 `.ts` 源码覆盖进去，重新打包生成新的 `.har` 包。
- **开发构建：** 开发者在修改/合并分支后，需在 `harmony/entry` 执行 `ohpm install` 并配合 DevEco Studio 的 **Clean Project** 与 **Rebuild Project**，使重打的包生效。

---

## 2. 安卓端 (Android) 包可见性排错

### 2.1 问题表现

在 Android 虚拟机或真机上，文件选择上传图片（png、jpg）成功后点击预览，提示：
`预览失败: No app associated with this mime type`

### 2.2 问题原因

从 **Android 11 (API Level 30)** 开始，系统引入了严格的**包可见性限制 (Package Visibility)**。由于 `react-native-file-viewer` 的原生层在拉起第三方应用前，会调用 `PackageManager.resolveActivity` 来检查设备中是否安装了能响应对应 MIME 类型的 App。如果应用没有在 `AndroidManifest.xml` 中显式声明对特定 Intent 的查询要求，系统将拦截此查询并返回 `null`，从而导致插件误以为没有关联应用而报错。

### 2.3 修复方法

在 `android/app/src/main/AndroidManifest.xml` 的 `<manifest>` 根标签下添加 `<queries>` 标签，定义需要查询的意图，从而允许 App 检测并调起系统内安装的图片浏览器和文件浏览器：

```xml
    <!-- Android 11+：FileViewer / DocumentPicker 包可见性 -->
    <queries>
      <!-- 声明查看文件的意图查询，允许打开包含任何 MIME 类型的 VIEW 动作 -->
      <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:mimeType="*/*" />
      </intent>
      <!-- 声明获取文件内容/打开文档的意图查询 -->
      <intent>
        <action android:name="android.intent.action.GET_CONTENT" />
      </intent>
      <intent>
        <action android:name="android.intent.action.OPEN_DOCUMENT" />
      </intent>
    </queries>
```

修改后需重新在 Android 环境中构建安装 App，即可正常通过系统的 `Intent.ACTION_VIEW` 预览图片或文档。
