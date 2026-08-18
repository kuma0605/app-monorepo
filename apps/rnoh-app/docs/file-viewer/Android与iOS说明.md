# Android / iOS 文件选择与预览说明

> 与 [鸿蒙集成与修复说明](./鸿蒙集成与修复说明.md) 对照阅读：鸿蒙需要 patch + `.har`；**Android / iOS 不需要**那些步骤。

---

## 1. 用的包

| 平台          | npm 包                              | 说明                                         |
| ------------- | ----------------------------------- | -------------------------------------------- |
| Android / iOS | `react-native-document-picker`      | 标准 RN 库，Autolink                         |
| Android / iOS | `react-native-file-viewer`          | 标准 RN 库，Autolink                         |
| Harmony       | `@react-native-ohos/react-native-*` | 仅 Metro `harmony` 平台解析，与 Android 无关 |

业务统一走 [`src/utils/openPickedFilePreview.ts`](../../src/utils/openPickedFilePreview.ts)：`Platform.OS === 'harmony'` 才走鸿蒙策略，Android 直接用 `fileCopyUri ?? uri` + 用户传入的 `openOptions`。

---

## 2. Android 需要做什么

### 2.1 已具备（无需重复配置）

| 项                               | 状态                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| RN 0.77 Autolink                 | `android/app/build.gradle` 中 `autolinkLibrariesWithApp()` 已启用                     |
| FileProvider                     | 由 `react-native-file-viewer` 库 manifest **自动合并**（`com.samrapp.provider`） |
| `file_viewer_provider_paths.xml` | 随库合并，**不必**再手动拷贝到 app                                                    |
| DocumentPicker 权限              | SAF 文件选择，库 manifest 为空；现代 Android 不额外声明存储权限即可选择文件           |
| 存储权限                         | 工程已有 `READ_EXTERNAL_STORAGE`（`maxSdkVersion="32"`），供 RNFS 等旧逻辑兼容        |

### 2.2 必须补充：Android 11+ 包可见性 `<queries>`

`targetSdkVersion` 为 **34** 时，用 `ACTION_VIEW` 打开 PDF 等文件，需在 **应用** `AndroidManifest.xml` 声明 `<queries>`，否则可能找不到可打开该类型的系统应用。

已在 [`android/app/src/main/AndroidManifest.xml`](../../android/app/src/main/AndroidManifest.xml) 添加：

```xml
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

- 业务会预览多种类型（PDF、Office、图片等），故 VIEW 使用 `*/*`；若上架 Play 需更严审核，可改为只声明实际 MIME（如 `application/pdf`）。
- 参考：[react-native-file-viewer 官方说明 — Android 11+ queries](./react-native-file-viewer.md)

### 2.3 不需要做的（旧文档可忽略）

- 手动 `react-native link`
- 手动改 `MainApplication` 注册 Package
- 手动复制 `file_viewer_provider_paths.xml`（Autolink + manifest merge 时代已过时）
- `patch-package` / `repack-ohos-hars.sh`（仅鸿蒙）

---

## 3. Android 验证

1. `npm run android`
2. 打开 **FileViewerDemo** 或 **DocumentPickerDemo**
3. 选 PDF / 图片 → 应弹出系统预览或「打开方式」
4. 若提示「没有应用可以打开」：检查 `<queries>` 是否生效（改 manifest 后需重新安装 APK）

---

## 4. iOS（简要）

| 项         | 说明                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------- |
| 安装       | `cd ios && pod install`（Autolink 会拉入 RNFileViewer、DocumentPicker）                         |
| 权限       | 文件选择走系统 UIDocumentPicker，一般**不需要**在 Info.plist 写存储权限                         |
| 预览       | QuickLook，传本地绝对路径或 `file://` URI                                                       |
| 与鸿蒙差异 | 无 patch / har；JS 可直接 `FileViewer.open(picked.uri)`，也可用统一工具 `openPickedFilePreview` |

---

## 5. 三端对照

|                | Harmony                         | Android                 | iOS       |
| -------------- | ------------------------------- | ----------------------- | --------- |
| 原生 patch     | 需要                            | 不需要                  | 不需要    |
| 额外 manifest  | oh-package `.har`               | `<queries>`             | 通常无    |
| JS 入口        | `openPickedFilePreview`（推荐） | 同上                    | 同上      |
| 典型 open 路径 | 沙箱 `picked.pdf` 或 docs URI   | `content://` / 沙箱路径 | `file://` |
