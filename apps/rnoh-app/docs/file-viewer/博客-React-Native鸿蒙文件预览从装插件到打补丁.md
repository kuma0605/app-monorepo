# 装了两个插件却打不开预览：React Native 鸿蒙文件选择与预览实录

> [!NOTE] > **版本适用性说明**：本文档最初基于 React Native 0.77 编写。当前项目已升级至 **React Native 0.82 (New Architecture)**，部分基础配置（如依赖版本、原生类命名等）可能已有更新。相关实现细节请以当前项目根目录配置及 `docs/harmonyos_packaging_guide.md` / `docs/harmony-and-android-file-viewer-patches.md` 为准。

> **技术栈：** React Native 0.77 + RNOH（React Native OpenHarmony）  
> **涉及库：** `@react-native-ohos/react-native-document-picker@9.3.2`、`@react-native-ohos/react-native-file-viewer@2.3.0-beta.2`  
> **场景：** 用户在 App 里选 PDF → 调起系统预览  
> **结论：** JS API 与 Android 一致，鸿蒙原生层和工程接入各缺一环；最终靠 **patch + 写回 `.har` + JS 策略** 跑通。

---

## 一、我们想要什么

业务需求很朴素：在 MARS App 里让用户**选一份 PDF，然后预览**。

React Native 生态里，这件事通常拆成两步：

1. **文件选择** — [`react-native-document-picker`](https://github.com/react-native-documents/document-picker)
2. **打开预览** — [`react-native-file-viewer`](https://github.com/vinzscam/react-native-file-viewer)

鸿蒙侧有社区适配包，名字带 `@react-native-ohos/` 前缀。照着接入文档装依赖、注册 Package、改 `CMakeLists.txt`、`oh-package.json5`，Demo 页也写好了——

然后点按钮，**预览失败**。

更糟的是：中间还经历过**编译能过、启动就崩**，以及**改了 patch 却 Rebuild 不生效**。

这篇文章按时间线，把「装插件 → 打不开 → 查因 → 打补丁 → 写回 har → JS 补策略」完整记录下来。若你也在 RNOH 上做文档预览，希望少踩几个我们踩过的坑。

---

## 二、官方示例在 Android 上长什么样

上游文档的套路很固定：

```typescript
import DocumentPicker from 'react-native-document-picker';
import FileViewer from 'react-native-file-viewer';

const [picked] = await DocumentPicker.pick({
  type: [DocumentPicker.types.pdf],
  copyTo: 'documentDirectory',
});

await FileViewer.open(picked.fileCopyUri ?? picked.uri);
```

Android 上，这条链路基本开箱即用：选完文件，系统 Preview 或「打开方式」弹出来，用户看到 PDF。

于是我们自然地把同一套 JS 搬到鸿蒙 Demo 里。

**结果不对。**

---

## 三、第一次失败：能编译，一启动就崩

早期为了「改原生方便」，我们在 `harmony/entry/oh-package.json5` 里把依赖指到了**源码目录**，而不是 npm 自带的 `.har`：

```json5
// 错误示范 — 不要这样写
'@react-native-ohos/react-native-document-picker':
  'file:../../node_modules/.../harmony/document_picker',
```

DevEco 编译通过了，真机/模拟器一启动，红屏或闪退，日志类似：

```text
cannot find record '&@react-native-ohos/react-native-document-picker/ts&9.3.2'
```

**原因：** RNOH 运行时对鸿蒙三方包有固定的模块解析方式；entry 工程期望消费的是 npm 里那种**源码格式的 `.har`**（内含 `ts.ts` 等结构），直接链源码目录会破坏 TurboModule 的加载路径。

**教训 1：** `oh-package.json5` 必须指向 `document_picker.har` / `file_viewer.har`，不要链源码文件夹。

---

## 四、第二次失败：预览报错 unknown file

改回 `.har` 后 App 能启动了。继续测选 PDF + 预览，常见报错：

```text
unknown file: preview failed
```

有时 JS 侧 `FileViewer.open()` 的 Promise **甚至 resolve 了**，但用户眼前没有任何预览窗口——这比直接报错还难查。

### 4.1 顺藤摸瓜：DocumentPicker 返回的 URI 不对

读 `@react-native-ohos/react-native-document-picker` 原生实现，发现 pick 结果里：

```typescript
// 原版 — 有问题
result = {
  uri: fUri.path, // 例如 /storage/...
  name: filename,
  fileCopyUri: '...',
};
```

鸿蒙文件选择器给的是带授权的 **`file://docs/storage/...`** 形式 URI。  
原生代码用 `FileUri` 解析后，只把 **path** 回传给 JS，**临时访问授权被剥掉了**。

后面的 FileViewer 拿着 `/storage/...` 去调 PreviewKit 或 `startAbility`，系统不认，预览失败。

**第一处 patch（DocumentPicker）：** 把 `uri: fUri.path` 改回 `uri: uri`。

### 4.2 中文文件名的静默失败

继续测，发现有的 PDF **文件名含中文**时，PreviewKit 无报错、无界面，像「点了没反应」。

DocumentPicker 的 `copyTo` 会把文件拷进应用沙箱。原版用**原始文件名**作为目标名。中文或特殊字符在 PreviewKit 路径解析里不稳定。

**第二处 patch（DocumentPicker）：** 新增 `getSafeCopyFileName()`，沙箱副本统一命名为 `picked.pdf`、`picked.docx` 等 ASCII 名。

注意：每次 `copyTo` 会先建一个 **UUID 子目录**，再在里面写 `picked.pdf`，所以连续选两个 PDF **不会互相覆盖**：

```text
.../files/<uuid-a>/picked.pdf
.../files/<uuid-b>/picked.pdf
```

JS 侧 `picked.name` 仍是用户所选原文件名，预览标题默认用它；磁盘 basename 只是为 PreviewKit 稳定而简化。

---

## 五、第三次失败：FileViewer 路由逻辑过于粗糙

DocumentPicker 修完后，路径和权限好了大半，但 FileViewer 仍经常失败。

对比 npm `2.2.0` 原版 `RNFileViewerTurboModule.ts`，问题集中在：

| 现象                                | 根因                                                     |
| ----------------------------------- | -------------------------------------------------------- |
| PreviewKit 认不出路径               | `/storage/...` 与 `file://docs/storage/...` 混用，未统一 |
| 该走 PreviewKit 却走了 startAbility | 不区分沙箱文件 vs 用户目录文件                           |
| 沙箱 PDF PreviewKit 失败            | 错误 fallback 到 startAbility，JS 侧仍 resolve           |
| 部分扩展名打不开                    | mime 库识别不全，缺 fallback                             |

**FileViewer patch 的核心思路：** 重写「打开文件」路由。

```
open(filepath)
  → resolveFileTarget()        // 统一 path、previewUri、mimeType
  → 沙箱文件？外部 URI？
  → 能 PreviewKit 且不需要「打开方式」？ → PreviewKit
  → 否则 → startAbility（规范 Want + 权限 flag）
  → PreviewKit 失败：沙箱路径直接 reject；外部路径才 fallback
```

几个关键函数：

- **`resolvePreviewUri`** — 沙箱用 `getUriFromPath`；`/storage/...` 转成 `file://docs/storage/...`
- **`isAppSandboxPath`** — 决定 PreviewKit 失败后是否允许 fallback
- **`fallbackMimeType`** — 补 `.pdf`、`.docx` 等常见类型

这一刀比 DocumentPicker 大得多，几乎是把 OpenFile 流程重写了一遍。

---

## 六、最隐蔽的一关：patch 了，Rebuild 怎么还不生效？

我们在 `node_modules` 里改 ETS，用 `patch-package` 固化成 patch 文件，团队 `npm install` 后也会自动打上。

但 DevEco **编译的不是 node_modules 里的散文件**，而是 `oh-package.json5` 引用的 **`.har` 压缩包**。

流程断裂点在这里：

```text
patch-package  →  改的是 node_modules/.../harmony/*/src/main/ets/*.ts
DevEco 编译    →  读的是 node_modules/.../harmony/*.har（安装时的旧内容）
```

所以会出现：**patch 文件在、源码目录里也是新的、Rebuild 了，运行的却是旧逻辑。**

### 6.1 解法：repack-ohos-hars.sh

项目加了 [`scripts/repack-ohos-hars.sh`](../../scripts/repack-ohos-hars.sh)：

1. 解压 npm 自带的 `.har`
2. 用 patch 后的 `documentPickerTurboModule.ts` / `RNFileViewerTurboModule.ts` 覆盖
3. 排除 macOS 产生的 `._*`（否则 C++ 报 UTF-8 错误）
4. 重新打包写回 `.har`

`package.json` 的 `postinstall` 串联：

```bash
patch-package && bash scripts/repack-ohos-hars.sh
```

**教训 2：** 鸿蒙 RNOH 三方库改原生，**patch + repack har** 是一体的，缺一不可。

### 6.2 另一个坑：不要用 hvigor assembleHar 重打

我们试过用 DevEco 的 `hvigor assembleHar` 自己打 har，产物是**字节码 har**，缺少运行时需要的 `ts.ts`，照样崩。

**教训 3：** 以 npm 自带**源码格式 har** 为底，只替换 ETS，不要用 assembleHar 产物替换。

---

## 七、JS 层最后一刀：不能照搬官方一行 open

原生修完以后，鸿蒙上仍有**两条预览路径**，取决于 DocumentPicker 有没有成功 `copyTo`：

| 条件             | 打开什么                   | 策略                                  |
| ---------------- | -------------------------- | ------------------------------------- |
| 有 `fileCopyUri` | 沙箱 `.../UUID/picked.pdf` | PreviewKit，去掉 `showOpenWithDialog` |
| 没有副本         | picker 原始 `uri`          | 强制 `showOpenWithDialog: true`       |
| 用户要应用推荐   | picker `uri`               | 传 `showAppsSuggestions`              |

业务统一走 [`src/utils/openPickedFilePreview.ts`](../../src/utils/openPickedFilePreview.ts)：

```typescript
import {openPickedFilePreview, isCancel} from '@/utils/openPickedFilePreview';

try {
  const result = await openPickedFilePreview();
  // result.statusLines 含 strategy、uri、fileCopyUri 等诊断信息
} catch (e) {
  if (!isCancel(e)) throw e;
}
```

DocumentPicker 固定带 `copyTo: 'documentDirectory'`，尽量走沙箱 PreviewKit 这条稳定路径。  
未传 `displayName` 时，预览标题默认 `picked.name`。

---

## 八、跑通以后：怎么验证

App 内：**我的 → 功能演示 → 文件预览**（[`FileViewerDemo`](../../src/screens/FileViewerDemo/index.tsx)）。

选 PDF 后，状态区应类似：

```text
strategy=harmony-sandbox-preview
uri=file://docs/storage/...
fileCopyUri=/data/storage/el2/base/haps/.../files/<uuid>/picked.pdf
openPath=.../picked.pdf
```

页面底部还有 **「下载示例 PDF 并预览」**，走 `react-native-fs` 下载 + FileViewer，用于验证网络 PDF 场景（与文件选择是两条链路）。

---

## 九、同事 / 读者复现清单

```bash
# 1. 依赖 + patch + repack har（postinstall 已自动执行）
npm install

# 2. 鸿蒙依赖
cd harmony/entry && ohpm install

# 3. DevEco：Sync → Clean → Rebuild → Run

# 4. Metro
npm run dev
```

改 patch 后若 Rebuild 仍像旧逻辑：

```bash
bash scripts/repack-ohos-hars.sh
cd harmony/entry && ohpm install
# 再 Clean + Rebuild
```

---

## 十、我们留下了什么

| 类型                 | 路径                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| DocumentPicker patch | `patches/@react-native-ohos+react-native-document-picker+9.3.2.patch` |
| FileViewer patch     | `patches/@react-native-ohos+react-native-file-viewer+2.2.0.patch`     |
| har 重打包           | `scripts/repack-ohos-hars.sh`                                         |
| JS 文件选择 + 预览   | `src/utils/openPickedFilePreview.ts`                                  |
| JS 下载 + 预览       | `src/utils/downloadAndOpenFile.ts`                                    |
| Demo                 | `src/screens/FileViewerDemo/index.tsx`                                |

---

## 十一、几条可带走的经验

1. **RNOH 三方库 ≠ 装完即用。** 社区包 JS API 往往对齐 Android，鸿蒙原生实现和 URI 模型仍要实测。
2. **鸿蒙文件预览的核心是 URI，不是 path。** `file://docs/...`、沙箱 path、临时授权，混了就会 unknown file。
3. **改原生别只改 node_modules。** entry 编译 har，必须 repack。
4. **oh-package 链 har，别链源码；别用 assembleHar 产物替换 npm har。**
5. **JS 层要有平台策略。** 同一段 `FileViewer.open(uri)` 在 Harmony 上要分「沙箱 PreviewKit」和「picker URI + 打开方式」两路。

Android 上这两个库 autolink 后通常就能用；**鸿蒙特有的 PreviewKit、文档 URI、沙箱路径**，才是这次补丁存在的原因。

---

## 延伸阅读（本仓库）

- [鸿蒙依赖修复原理.md](./鸿蒙依赖修复原理.md) — 两库差什么、怎么修（速查）
- [鸿蒙集成与修复说明.md](./鸿蒙集成与修复说明.md) — patch 清单、FAQ
- [鸿蒙接入指南-step-by-step.md](./鸿蒙接入指南-step-by-step.md) — 新项目从零接入
- [README.md](./README.md) — 文档索引

---

_若你在其他 RNOH 项目里复现了类似 patch，欢迎对照 patch 文件与本文流程；上游库版本升级后，请重新 diff 原生 ETS，patch 可能需要手工合并。_
