# Android 文件选择 + 预览 — Step by Step 接入指南

> [!NOTE] > **版本适用性说明**：本文档最初基于 React Native 0.77 编写。当前项目已升级至 **React Native 0.82 (New Architecture)**，部分基础配置（如依赖版本、原生类命名等）可能已有更新。相关实现细节请以当前项目根目录配置及 `docs/harmonyos_packaging_guide.md` / `docs/harmony-and-android-file-viewer-patches.md` 为准。

> 在新 React Native 项目中复现 MARS App 已验证的 Android 配置。  
> 适用：**React Native 0.60+（推荐 0.82）**，`targetSdkVersion` ≥ 30。

鸿蒙端需 patch / `.har`，**Android 不需要**。本文仅覆盖 Android。

---

## 0. 前置条件

- 已有可运行的 RN Android 工程（`android/`、`autolinkLibrariesWithApp()` 已启用）。
- 与 Harmony 共用同一套 JS 时，同时安装 `@react-native-ohos/*` 无妨，**Android 构建不会用到它们**。

---

## Step 1 · 安装 npm 依赖

```bash
npm install \
  react-native-document-picker@^9.3.1 \
  react-native-file-viewer@^2.1.5
```

`package.json` 示例：

```json
{
  "dependencies": {
    "react-native-document-picker": "^9.3.1",
    "react-native-file-viewer": "^2.1.5"
  }
}
```

> import 名称保持不变：`import DocumentPicker from 'react-native-document-picker'`。

---

## Step 2 · 确认 Autolink（一般无需手动操作）

RN 0.77 在 `android/app/build.gradle` 中应已有：

```gradle
react {
    autolinkLibrariesWithApp()
}
```

这会自动：

- 链接 `react-native-document-picker`、`react-native-file-viewer` 原生模块；
- 合并 `react-native-file-viewer` 的 **FileProvider**（`${applicationId}.provider`）；
- 合并 `file_viewer_provider_paths.xml`。

**不需要**（旧文档步骤，可忽略）：

- `react-native link`
- 手动改 `MainApplication.java` / `MainApplication.kt`
- 手动复制 `file_viewer_provider_paths.xml` 到 app

---

## Step 3 · 配置 AndroidManifest.xml（必须）

`targetSdkVersion` ≥ 30（Android 11+）时，必须声明 **包可见性 `<queries>`**，否则 `FileViewer.open` 可能找不到可打开 PDF 的应用。

编辑 `android/app/src/main/AndroidManifest.xml`，在 `</manifest>` 前、`</application>` 后增加：

```xml
<!-- 文件选择 + 预览：Android 11+ 包可见性 -->
<queries>
  <!-- FileViewer：系统预览 / 打开方式 -->
  <intent>
    <action android:name="android.intent.action.VIEW" />
    <data android:mimeType="*/*" />
  </intent>
  <!-- DocumentPicker：系统文档选择器 -->
  <intent>
    <action android:name="android.intent.action.GET_CONTENT" />
  </intent>
  <intent>
    <action android:name="android.intent.action.OPEN_DOCUMENT" />
  </intent>
</queries>
```

说明：

- 业务预览多种文件类型，使用 `mimeType="*/*"`。
- 若 Google Play 审核要求更细，可只声明实际 MIME，例如 `application/pdf`。
- 参考：[react-native-file-viewer 官方 — Android 11+ queries](./react-native-file-viewer.md)

### 权限说明（通常不用额外加）

| 能力           | 说明                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| DocumentPicker | 使用 SAF，**不需** `READ_EXTERNAL_STORAGE` 即可选文件                            |
| FileViewer     | 通过 FileProvider + `ACTION_VIEW` 打开，库 manifest 已带 Provider                |
| 旧版存储权限   | 若项目已有 `READ_EXTERNAL_STORAGE`（`maxSdkVersion="32"`）可保留，与本能力无冲突 |

---

## Step 4 · 复制 JS 业务工具（推荐，跨端统一）

从 MARS 工程复制：

```
src/utils/openPickedFilePreview.ts
```

Android 走默认分支（非 `Platform.OS === 'harmony'`）：

- 打开路径：`picked.fileCopyUri ?? picked.uri`
- `openOptions` 原样传给 `FileViewer.open`

最小用法：

```typescript
import {openPickedFilePreview, isCancel} from '@/utils/openPickedFilePreview';

try {
  const result = await openPickedFilePreview({displayName: '文档'});
  console.log(result.statusLines);
} catch (e) {
  if (!isCancel(e)) throw e;
}
```

### 官方最简写法（仅 Android 也可）

```typescript
import DocumentPicker from 'react-native-document-picker';
import FileViewer from 'react-native-file-viewer';

const [picked] = await DocumentPicker.pick({
  type: [DocumentPicker.types.allFiles],
  copyTo: 'documentDirectory',
});
await FileViewer.open(picked.fileCopyUri ?? picked.uri);
```

---

## Step 5 · 构建与运行

```bash
# Metro
npm start

# 安装到设备 / 模拟器（改 manifest 后需重新安装 APK）
npm run android
```

真机调试时如需访问本机 Metro：

```bash
adb reverse tcp:8081 tcp:8081
```

---

## Step 6 · 验证清单

| 步骤            | 预期                                          |
| --------------- | --------------------------------------------- |
| App 启动        | 无原生崩溃                                    |
| DocumentPicker  | 弹出系统文件选择器                            |
| 选 PDF          | 返回 `uri`（多为 `content://...`）            |
| 有 copyTo       | `fileCopyUri` 为应用沙箱路径                  |
| FileViewer.open | 弹出系统预览或「打开方式」                    |
| 无应用可打开    | 检查 Step 3 的 `<queries>` 是否已加并重新安装 |

可选：接入 `src/screens/FileViewerDemo/index.tsx` 做 UI 测试。

---

## Step 7 · 不需要做的（避免踩坑）

| 操作                                          | 原因                             |
| --------------------------------------------- | -------------------------------- |
| 使用 `@react-native-ohos/*` 包做 Android 构建 | 仅 Harmony Metro 使用            |
| `patch-package` / `repack-ohos-hars.sh`       | 仅鸿蒙                           |
| 手动注册 FileProvider                         | Autolink + manifest merge 已处理 |
| 鸿蒙 `oh-package.json5` / DevEco 配置         | 与 Android Gradle 无关           |

---

## 附录 A · 需复制到新项目的文件（Android 最小集）

```
android/app/src/main/AndroidManifest.xml   # 增加 <queries> 片段
src/utils/openPickedFilePreview.ts       # 推荐（跨端）
src/screens/FileViewerDemo/index.tsx     # 可选 Demo
```

`package.json` 增加依赖即可，无需复制 patch / scripts。

## 附录 B · 与 Harmony 对照

|             | Harmony                                      | Android                 |
| ----------- | -------------------------------------------- | ----------------------- |
| npm 包      | `@react-native-ohos/*` + patch + har         | `react-native-*`        |
| 原生配置    | `oh-package.json5`、CMake、RNPackagesFactory | Autolink + `<queries>`  |
| 预览策略    | 沙箱 PreviewKit / docs URI                   | `content://` 或沙箱路径 |
| postinstall | `patch-package` + repack har                 | 无                      |

Harmony 完整步骤见 [鸿蒙接入指南-step-by-step.md](./鸿蒙接入指南-step-by-step.md)。

## 附录 C · 参考文档

- [react-native-file-viewer.md](./react-native-file-viewer.md) — API 与 Android 11 queries 原文
- [Android 与 iOS 说明.md](./Android与iOS说明.md) — 补充说明（含 iOS 简要）
