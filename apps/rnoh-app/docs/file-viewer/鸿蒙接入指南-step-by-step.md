# Harmony 文件选择 + 预览 — Step by Step 接入指南

> [!NOTE] > **版本适用性说明**：本文档最初基于 React Native 0.77 编写。当前项目已升级至 **React Native 0.82 (New Architecture)**，部分基础配置（如依赖版本、原生类命名等）可能已有更新。相关实现细节请以当前项目根目录配置及 `docs/harmonyos_packaging_guide.md` / `docs/harmony-and-android-file-viewer-patches.md` 为准。

> 在新 RNOH 项目中复现 MARS App 已验证的配置。  
> 适用：**React Native 0.77** + **RNOH**，DevEco Studio 6.x，API 12+。

---

## 0. 前置条件

- 已有可运行的 RNOH 工程（含 `harmony/entry`、Metro `harmony` 平台、`@react-native-oh/react-native-harmony`）。
- 本机已安装：Node.js、DevEco Studio、ohpm。
- 了解：鸿蒙端 **不能** 只用官方示例直接预览 PDF，需 **patch + `.har` 重打包**（见下文）。

---

## Step 1 · 安装 npm 依赖

在项目根目录 `package.json` 增加（版本与 RN 0.77 对齐）：

```bash
npm install \
  react-native-document-picker@^9.3.1 \
  react-native-file-viewer@^2.1.5 \
  @react-native-ohos/react-native-document-picker@^9.3.2 \
  @react-native-ohos/react-native-file-viewer@^2.2.0
```

说明：

| 包                                                | 用途                                  |
| ------------------------------------------------- | ------------------------------------- |
| `react-native-document-picker`                    | Android / iOS JS API（import 名不变） |
| `react-native-file-viewer`                        | Android / iOS JS API                  |
| `@react-native-ohos/react-native-document-picker` | Harmony 原生实现                      |
| `@react-native-ohos/react-native-file-viewer`     | Harmony 原生实现                      |

Metro 在 `harmony` 平台会自动解析到 `@react-native-ohos/*`（由 `createHarmonyMetroConfig` 提供）。

---

## Step 2 · 复制 patch 与 repack 脚本

从 MARS 工程（或本仓库）复制到**新项目**：

```
patches/@react-native-ohos+react-native-document-picker+9.3.2.patch
patches/@react-native-ohos+react-native-file-viewer+2.2.0.patch
scripts/repack-ohos-hars.sh
```

安装 patch 工具：

```bash
npm install -D patch-package
chmod +x scripts/repack-ohos-hars.sh
```

在 `package.json` 的 `scripts` 中加入（或合并进现有 `postinstall`）：

```json
"postinstall": "patch-package && bash scripts/repack-ohos-hars.sh"
```

执行一次：

```bash
npm install
```

预期：

- `patch-package` 修改 `node_modules` 内 ETS 源码；
- `repack-ohos-hars.sh` 把 patch 写回 `*.har`（**必须**，否则 DevEco 编的是未 patch 的 har）。

---

## Step 3 · 配置 harmony/entry/oh-package.json5

在 `dependencies` 中增加，**路径必须是 `.har` 文件**：

```json5
{
  dependencies: {
    // ... 已有 @rnoh/react-native-openharmony 等
    '@react-native-ohos/react-native-document-picker': 'file:../../node_modules/@react-native-ohos/react-native-document-picker/harmony/document_picker.har',
    '@react-native-ohos/react-native-file-viewer': 'file:../../node_modules/@react-native-ohos/react-native-file-viewer/harmony/file_viewer.har',
  },
}
```

> **禁止** 写成 `.../harmony/document_picker` 或 `.../file_viewer` 源码目录。  
> 源码直链会导致启动崩溃：  
> `cannot find record '&@react-native-ohos/react-native-document-picker/ts&9.3.2'`

同步鸿蒙依赖：

```bash
cd harmony/entry && ohpm install
```

DevEco 中打开 `harmony/` 目录，点击 **Sync**。

---

## Step 4 · 注册 ArkTS Package

编辑 `harmony/entry/src/main/ets/RNPackagesFactory.ets`：

```typescript
import {DocumentPickerPackage} from '@react-native-ohos/react-native-document-picker/ts';
import {RNFileViewerPackage} from '@react-native-ohos/react-native-file-viewer/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    // ... 已有 Package
    new DocumentPickerPackage(ctx),
    new RNFileViewerPackage(ctx),
  ];
}
```

---

## Step 5 · 配置 C++（CMakeLists + PackageProvider）

### 5.1 CMakeLists.txt

在 `harmony/entry/src/main/cpp/CMakeLists.txt` 中确认已有：

```cmake
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

# 在 add_subdirectory 区域增加：
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-document-picker/src/main/cpp" ./document_picker)
add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-file-viewer/src/main/cpp" ./file-viewer)

# 在 target_link_libraries 区域增加：
target_link_libraries(rnoh_app PUBLIC rnoh_document_picker)
target_link_libraries(rnoh_app PUBLIC rnoh_file_viewer)
```

> `OH_MODULES` 指向 `harmony/entry/oh_modules`（ohpm 安装 `.har` 后的解压路径）。

### 5.2 PackageProvider.cpp

```cpp
#include "DocumentPickerPackage.h"
#include "FileViewerPackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
  return {
      // ... 已有 Package
      std::make_shared<DocumentPickerPackage>(ctx),
      std::make_shared<FileViewerPackage>(ctx),
  };
}
```

### 5.3 Codegen（若工程已有 codegen 流程）

与其他 TurboModule 一样，新增库后执行一次：

```bash
npm run codegen
```

（脚本示例：`react-native codegen-harmony --cpp-output-path ./harmony/entry/src/main/cpp/generated ...`）

---

## Step 6 · 复制 JS 业务工具（推荐）

从 MARS 复制：

```
src/utils/openPickedFilePreview.ts
```

Harmony 专用逻辑摘要：

- DocumentPicker 固定 `copyTo: 'documentDirectory'`，尽量拿到 `fileCopyUri`（沙箱 `picked.pdf`）。
- 有 `fileCopyUri` → `FileViewer.open(fileCopyUri)`，走 PreviewKit。
- 无副本 → `FileViewer.open(uri, { showOpenWithDialog: true })`。
- 未传 `displayName` 时，预览标题默认 `picked.name`；沙箱路径仍为 `picked.{ext}`。

最小调用：

```typescript
import {openPickedFilePreview, isCancel} from '@/utils/openPickedFilePreview';

try {
  // 默认显示原文件名
  await openPickedFilePreview();

  // 自定义标题
  await openPickedFilePreview({displayName: '文档'});
} catch (e) {
  if (!isCancel(e)) console.error(e);
}
```

也可参考 Demo：`src/screens/FileViewerDemo/index.tsx`。

---

## Step 7 · 构建与运行

```bash
# 终端 1：Harmony JS Bundle
npm run dev

# 终端 2（可选）：确认 patch + har
npm install
cd harmony/entry && ohpm install
```

DevEco：

1. 打开 `harmony/`
2. **Build → Clean Project**
3. **Build → Rebuild Project**
4. Run `entry`（真机或模拟器）

PC 模拟器若缺 so，在 `harmony/entry/build-profile.json5` 的 `abiFilters` 增加 `x86_64`（见 [已知问题 #002](../usage/已知问题.md)）。

---

## Step 8 · 验证清单

| 检查项   | 预期                                               |
| -------- | -------------------------------------------------- |
| App 启动 | 无 `cannot find record .../ts&...`                 |
| 选 PDF   | Demo 显示 `uri=file://docs/storage/...`            |
| 沙箱副本 | `fileCopyUri=.../picked.pdf`                       |
| 预览     | PreviewKit 打开或系统「打开方式」，非 unknown file |

Demo 状态示例：

```
strategy=harmony-sandbox-preview
uri=file://docs/storage/...
fileCopyUri=/data/storage/el2/.../picked.pdf
openPath=.../picked.pdf
```

---

## Step 9 · 常见问题速查

| 现象                                     | 处理                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| 启动崩溃 `cannot find record .../ts&...` | `oh-package.json5` 改回 `.har`，勿链源码                                                |
| 改了 patch Rebuild 无效                  | `bash scripts/repack-ohos-hars.sh` → `cd harmony/entry && ohpm install` → Clean Rebuild |
| C++ `._Props.cpp` UTF-8 错误             | har 含 macOS 元数据；用 `repack-ohos-hars.sh` 重打                                      |
| 用 `hvigor assembleHar` 重打 har         | **不要**；会生成字节码 har，缺 `ts.ts`                                                  |
| 预览 unknown file                        | 确认 postinstall 已跑、har 已 repack；看 `copyError` / `strategy`                       |

---

## 附录 A · 需从新项目复制的文件清单

```
patches/@react-native-ohos+react-native-document-picker+9.3.2.patch
patches/@react-native-ohos+react-native-file-viewer+2.2.0.patch
scripts/repack-ohos-hars.sh
src/utils/openPickedFilePreview.ts          # 推荐
src/screens/FileViewerDemo/index.tsx        # 可选 Demo
```

## 附录 B · patch 改了什么（摘要）

**DocumentPicker**

- `uri` 返回 picker 原始 URI，不转 `fUri.path`
- `copyTo` 副本命名为 `picked.{ext}`

**FileViewer**

- 正确构造 `file://docs/storage/...` previewUri
- 沙箱优先 PreviewKit；失败不再错误 fallback
- 去掉「凡 `/storage/` 都 startAbility」

详细原理见 [鸿蒙集成与修复说明](./鸿蒙集成与修复说明.md)。

## 附录 C · 官方文档

- [rnoh-react-native-file-viewer.md](./rnoh-react-native-file-viewer.md) — 社区接入模板（未含本仓库 patch）
- [react-native-file-viewer.md](./react-native-file-viewer.md) — JS API
