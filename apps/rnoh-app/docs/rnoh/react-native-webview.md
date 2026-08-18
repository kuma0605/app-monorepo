> 模板版本：v0.4.0

<p align="center">
  <h1 align="center"> <code>react-native-webview</code> </h1>
</p>
<p align="center">
    <a href="https://github.com/react-native-webview/react-native-webview">
        <img src="https://img.shields.io/badge/platforms-android%20%7C%20ios%20%7C%20windows%20%7C%20macos%20%7C%20harmony%20-lightgrey.svg" alt="Supported platforms" />
    </a>
    <a href="https://github.com/react-native-webview/react-native-webview/blob/master/LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
    </a>
</p>

本项目基于 [react-native-webview](https://github.com/react-native-webview/react-native-webview) 开发。

## 1. 安装与使用

该第三方库的仓库已迁移至 Gitcode，且支持直接从 npm 下载，新的包名为：`@react-native-ohos/react-native-webview` 版本所属关系如下：

| 三方库名称                                | 三方库版本           | 发布信息                                                                                                | 支持 RN 版本 | Autolink | 编译 API 版本 | 社区基线版本 | npm 地址                                                                               |
| ----------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- | ------------ | -------- | ------------- | ------------ | -------------------------------------------------------------------------------------- |
| @react-native-ohos/react-native-webview   | ~13.16.1             | [Gitcode Releases](https://gitcode.com/openharmony-sig/rntpc_react-native-webview/releases)             | 0.82.\*      | 否       | API20+        | 13.16.0      | [Npm Address](https://www.npmjs.com/package/@react-native-ohos/react-native-webview)   |
| @react-native-ohos/react-native-webview   | ~13.15.1             | [Gitcode Releases](https://gitcode.com/openharmony-sig/rntpc_react-native-webview/releases)             | 0.77.\*      | 否       | API20+        | 13.15.0      | [Npm Address](https://www.npmjs.com/package/@react-native-ohos/react-native-webview)   |
| @react-native-ohos/react-native-webview   | ~13.10.5             | [Gitcode Releases](https://gitcode.com/openharmony-sig/rntpc_react-native-webview/releases)             | 0.72.\*      | 是       | API20+        | 13.10.2      | [Npm Address](https://www.npmjs.com/package/@react-native-ohos/react-native-webview)   |
| @react-native-oh-tpl/react-native-webview | <=13.10.4@deprecated | [Github Releases(deprecated)](https://github.com/react-native-oh-library/react-native-webview/releases) | 0.72.\*      | 否       | API12+        | 13.10.2      | [Npm Address](https://www.npmjs.com/package/@react-native-oh-tpl/react-native-webview) |

对于未发布到 npm 的旧版本，请参考[安装指南](/tgz-usage.md)安装 tgz 包。

进入到工程目录并输入以下命令：

<!-- tabs:start -->

**npm**

```bash
npm install @react-native-ohos/react-native-webview
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-webview
```

<!-- tabs:end -->

下面的代码展示了这个库的基本使用场景：

> [!WARNING] 使用时 import 的库名不变。

```js
import {WebView} from 'react-native-webview';

export default function WebViewDemo() {
  return <WebView source={{uri: 'https://reactnative.dev/'}} />;
}
```

## 2. Link

|                       | Is supported autolink | Supported RN Version |
| --------------------- | --------------------- | -------------------- |
| ~13.16.1              | No                    | 0.82                 |
| ~13.15.1              | No                    | 0.77                 |
| ~13.10.5              | Yes                   | 0.72                 |
| <= 13.10.4@deprecated | No                    | 0.72                 |

使用 AutoLink 的工程需要根据该文档配置，Autolink 框架指导文档：https://gitcode.com/openharmony-sig/ohos_react_native/blob/master/docs/zh-cn/Autolinking.md

如您使用的版本支持 Autolink，并且工程已接入 Autolink，可跳过 ManualLink 配置。

<details>
  <summary>ManualLink: 此步骤为手动配置原生依赖项的指导</summary>

首先需要使用 DevEco Studio 打开项目里的 HarmonyOS 工程 `harmony`

### 2.1.在工程根目录的 `oh-package.json5` 添加 overrides 字段

```json
{
  ...
  "overrides": {
    "@rnoh/react-native-openharmony" : "./react_native_openharmony"
  }
}
```

### 2.2.引入原生端代码

目前有两种方法：

1. 通过 har 包引入（在 IDE 完善相关功能后该方法会被遗弃，目前首选此方法）；
2. 直接链接源码。

方法一：通过 har 包引入

> [!TIP] har 包位于三方库安装路径的 `harmony` 文件夹下。

打开 `entry/oh-package.json5`，添加以下依赖

```json
"dependencies": {
    "@rnoh/react-native-openharmony": "file:../react_native_openharmony",

    "@react-native-ohos/react-native-webview": "file:../../node_modules/@react-native-ohos/react-native-webview/harmony/rn_webview.har"
}
```

点击右上角的 `sync` 按钮

或者在终端执行：

```bash
cd entry
ohpm install
```

方法二：直接链接源码

> [!TIP] 如需使用直接链接源码，请参考[直接链接源码说明](/link-source-code.md)

### 2.3.配置 CMakeLists 和引入 WebViewPackage

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```diff
project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(NODE_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../node_modules")
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
+set(OH_MODULE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
set(RNOH_CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../../react-native-harmony/harmony/cpp")
set(LOG_VERBOSITY_LEVEL 1)
set(CMAKE_ASM_FLAGS "-Wno-error=unused-command-line-argument -Qunused-arguments")
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now,-z,noexecstack -s -fPIE -pie")
set(WITH_HITRACE_SYSTRACE 1) # for other CMakeLists.txt files to use
add_compile_definitions(WITH_HITRACE_SYSTRACE)

add_subdirectory("${RNOH_CPP_DIR}" ./rn)

# RNOH_BEGIN: manual_package_linking_1
add_subdirectory("../../../../sample_package/src/main/cpp" ./sample-package)
+ add_subdirectory("${OH_MODULE_DIR}/@react-native-ohos/react-native-webview/src/main/cpp" ./webview)

# RNOH_END: manual_package_linking_1

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)
target_link_libraries(rnoh_app PUBLIC rnoh)

# RNOH_BEGIN: manual_package_linking_2
target_link_libraries(rnoh_app PUBLIC rnoh_sample_package)
+ target_link_libraries(rnoh_app PUBLIC rnoh_webview)
# RNOH_END: manual_package_linking_2
```

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```diff
#include "RNOH/PackageProvider.h"
#include "SamplePackage.h"
+ #include "WebViewPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
      std::make_shared<SamplePackage>(ctx),
+     std::make_shared<WebViewPackage>(ctx)
    };
}
```

### 2.4.在 ArkTs 侧引入 webview 组件

找到 **function buildCustomComponent()**，一般位于 `entry/src/main/ets/pages/index.ets` 或 `entry/src/main/ets/rn/LoadBundle.ets`，添加：

```diff
+ import { WebView, WEB_VIEW } from "@react-native-ohos/react-native-webview"

@Builder
function buildCustomComponent(ctx: ComponentBuilderContext) {
+ if (ctx.componentName === WEB_VIEW) {
+   WebView({
+     ctx: ctx.rnComponentContext,
+     tag: ctx.tag
+   })
+ }
 ...
}
...
```

> [!TIP] 本库使用了混合方案，需要添加组件名。

在`entry/src/main/ets/pages/index.ets` 或 `entry/src/main/ets/rn/LoadBundle.ets` 找到常量 `arkTsComponentNames` 在其数组里添加组件名

```diff
const arkTsComponentNames: Array<string> = [
  SampleView.NAME,
  GeneratedSampleView.NAME,
  PropsDisplayer.NAME,
+ WEB_VIEW
  ];
```

### 2.5.在 ArkTs 侧引入 WebViewPackage

打开 `entry/src/main/ets/RNPackagesFactory.ts`，添加：

```diff
import type {RNPackageContext, RNPackage} from 'rnoh/ts';
import {SamplePackage} from 'rnoh-sample-package/ts';
+ import { WebViewPackage } from '@react-native-ohos/react-native-webview/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new SamplePackage(ctx),
+   new WebViewPackage(ctx)
  ];
}
```

</details>

### 2.6. 运行

点击右上角的 `sync` 按钮

或者在终端执行：

```bash
cd entry
ohpm install
```

然后编译、运行即可。

## 3. 约束与限制

### 3.1. 兼容性

要使用此库，需要使用正确的 React-Native 和 RNOH 版本。另外，还需要使用配套的 DevEco Studio 和 手机 ROM。

在以下版本验证通过：

1. RNOH: 0.72.96; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
2. RNOH: 0.72.33; SDK: HarmonyOS NEXT B1; IDE: DevEco Studio: 5.0.3.900; ROM: Next.0.0.71;
3. RNOH: 0.77.18; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;
4. RNOH: 0.82.1; SDK: HarmonyOS 6.0.0 Release SDK; IDE: DevEco Studio 6.0.0.858; ROM: 6.0.0.112;

## 4.属性

> [!WARNING]ignoreSilentHardwareSwitch 需要设置 true 网页播放才有声音

> [!TIP] "Platform"列表示该属性在原三方库上支持的平台。

> [!TIP] "HarmonyOS Support"列为 yes 表示 HarmonyOS 平台支持该属性；no 则表示不支持；partially 表示部分支持。使用方法跨平台一致，效果对标 iOS 或 Android 的效果。

详情请查看[webview 官方文档](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md)

| Name                                                     | Description                                                                                                                                                                                                                                                                                                                      | Type             | Required | Platform            | HarmonyOS Support                                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `source`                                                 | Loads static HTML or a URI (with optional headers) in the WebView                                                                                                                                                                                                                                                                | object           | yes      | All                 | partially (Only of: **Load uri :** uri headers **Static HTML :** html baseUrl)                  |
| `ref`                                                    | Used to get a reference to a component instance                                                                                                                                                                                                                                                                                  | object           | yes      | All                 | yes                                                                                             |
| `injectedJavaScript?`                                    | Set this to provide JavaScript that will be injected into the web page after the document finishes loading                                                                                                                                                                                                                       | string           | No       | All                 | yes                                                                                             |
| `originWhitelist?`                                       | List of origin strings to allow being navigated to.                                                                                                                                                                                                                                                                              | string[]         | No       | iOS,Android,macOS   | No                                                                                              |
| `scalesPageToFit?`                                       | Boolean that controls whether the web content is scaled to fit the view and enables the user to change the scale.                                                                                                                                                                                                                | boolean          | No       | Android             | yes                                                                                             |
| `startInLoadingState?`                                   | Boolean value that forces the WebView to show the loading view on the first load.                                                                                                                                                                                                                                                | boolean          | No       | iOS,Android,macOS   | No                                                                                              |
| `style?`                                                 | A style object that allow you to customize the WebView style.                                                                                                                                                                                                                                                                    | Style            | No       | ALL                 | yes                                                                                             |
| `domStorageEnabled?`                                     | Boolean value to control whether DOM Storage is enabled. Used only in Android and Harmony. Due to security and privacy reasons, the default value in Harmony is `false`                                                                                                                                                          | boolean          | No       | Android             | yes                                                                                             |
| `javaScriptEnabled?`                                     | Boolean value to enable JavaScript in the WebView.                                                                                                                                                                                                                                                                               | boolean          | No       | All                 | yes                                                                                             |
| `showsHorizontalScrollIndicator?`                        | Boolean value that determines whether a horizontal scroll indicator is shown in the WebView.                                                                                                                                                                                                                                     | boolean          | No       | iOS,Android,macOS   | yes                                                                                             |
| `showsVerticalScrollIndicator`                           | Boolean value that determines whether a vertical scroll indicator is shown in the WebView.                                                                                                                                                                                                                                       | boolean          | No       | iOS,Android,macOS   | yes                                                                                             |
| `ignoreSilentHardwareSwitch`                             | Boolean value that When set to true the hardware silent switch is ignored.                                                                                                                                                                                                                                                       | boolean          | No       | iOS                 | yes                                                                                             |
| `cacheEnabled?`                                          | Sets whether WebView should use browser caching.                                                                                                                                                                                                                                                                                 | boolean          | No       | iOS,Android,macOS   | yes                                                                                             |
| `cacheMode?`                                             | Overrides the way the cache is used.                                                                                                                                                                                                                                                                                             | string           | No       | Android             | yes                                                                                             |
| `textZoom?`                                              | If the user has set a custom font size in the Android and harmony system, an undesirable scale of the site interface in WebView occurs.                                                                                                                                                                                          | number           | No       | Android             | yes                                                                                             |
| `incognito?`                                             | Does not store any data within the lifetime of the WebView.                                                                                                                                                                                                                                                                      | boolean          | NO       | All                 | yes                                                                                             |
| `mediaPlaybackRequiresUserAction?`                       | Boolean that determines whether HTML5 audio and video requires the user to tap them before they start playing. The default value is `true`. (Android API minimum version 17).                                                                                                                                                    | boolean          | NO       | iOS,Android,macOS   | yes                                                                                             |
| `geolocationEnabled?`                                    | Set whether Geolocation is enabled in the `WebView`. The default value is `false`. Used only in Android.                                                                                                                                                                                                                         | boolean          | NO       | Android             | yes                                                                                             |
| `fraudulentWebsiteWarningEnabled?`                       | A Boolean value that indicates whether the web view shows warnings for suspected fraudulent content, such as malware or phishing attempts. The default value is `true`. (iOS 13+)                                                                                                                                                | boolean          | NO       | iOS                 | yes (该接口不生效，调用不会产生任何实际效果,非法和欺诈网站是强制启用的，鸿蒙 OS 当前实现如此。) |
| `userAgent?`                                             | Sets the user-agent for the `WebView`.                                                                                                                                                                                                                                                                                           | string           | NO       | iOS,Android,macOS   | yes                                                                                             |
| `minimumFontSize?`                                       | Android enforces a minimum font size based on this value. A non-negative integer between 1 and 72. Any number outside the specified range will be pinned. Default value is 8. If you are using smaller font sizes and are having trouble fitting the whole window onto one screen, try setting this to a smaller value.          | number           | No       | Android             | yes                                                                                             |
| `forceDarkOn?`                                           | Configuring Dark Theme                                                                                                                                                                                                                                                                                                           | boolean          | No       | Android             | yes                                                                                             |
| `injectedJavaScriptBeforeContentLoaded?`                 | Set this to provide JavaScript that will be injected into the web page after the document element is created, but before other subresources finish loading.                                                                                                                                                                      | string           | No       | iOS,Android,macOS   | yes                                                                                             |
| `automaticallyAdjustContentInsets?`                      | Controls whether to adjust the content inset for web views that are placed behind a navigation bar, tab bar, or toolbar. The default value is `true`                                                                                                                                                                             | boolean          | No       | iOS                 | No                                                                                              |
| `automaticallyAdjustsScrollIndicatorInsets?`             | Controls whether to adjust the scroll indicator inset for web views that are placed behind a navigation bar, tab bar, or toolbar. The default value `false`. (iOS 13+)                                                                                                                                                           | boolean          | No       | iOS                 | No                                                                                              |
| `injectedJavaScriptBeforeContentLoadedForMainFrameOnly?` | If `true` (default; mandatory for Android), loads the `injectedJavaScriptBeforeContentLoaded` only into the main frame.                                                                                                                                                                                                          | boolean          | No       | iOS                 | No                                                                                              |
| `nativeConfig?`                                          | Override the native component used to render the WebView. Enables a custom native WebView which uses the same JavaScript as the original WebView.                                                                                                                                                                                | object           | No       | iOS, Android, macOS | No                                                                                              |
| `decelerationRate?`                                      | A floating-point number that determines how quickly the scroll view decelerates after the user lifts their finger. You may also use the string shortcuts `"normal"` and `"fast"` which match the underlying iOS                                                                                                                  | number           | No       | iOS                 | No                                                                                              |
| `javaScriptCanOpenWindowsAutomatically?`                 | A Boolean value indicating whether JavaScript can open windows without user interaction. The default value is `false`.                                                                                                                                                                                                           | boolean          | No       | iOS, Android, macOS | No                                                                                              |
| `AndroidLayerType?`                                      | Specifies the layer type.                                                                                                                                                                                                                                                                                                        | string           | No       | Android             | No                                                                                              |
| `mixedContentMode?`                                      | Specifies the mixed content mode. i.e WebView will allow a secure origin to load content from any other origin.                                                                                                                                                                                                                  | string           | No       | Android             | No                                                                                              |
| `allowsFullscreenVideo?`                                 | Boolean that determines whether videos are allowed to be played in fullscreen. The default value is false.                                                                                                                                                                                                                       | boolean          | NO       | Android             | NO                                                                                              |
| `allowsInlineMediaPlayback?`                             | Boolean that determines whether HTML5 videos play inline or use the native full-screen controller. The default value is `false`.                                                                                                                                                                                                 | boolean          | NO       | iOS                 | NO                                                                                              |
| `allowsAirPlayForMediaPlayback?`                         | A Boolean value indicating whether AirPlay is allowed. The default value is `false`.                                                                                                                                                                                                                                             | boolean          | NO       | iOS and macOS       | NO                                                                                              |
| `contentInset?`                                          | The amount by which the web view content is inset from the edges of the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.                                                                                                                                                                                         | object           | NO       | iOS                 | NO                                                                                              |
| `contentInsetAdjustmentBehavior?`                        | This property specifies how the safe area insets are used to modify the content area of the scroll view. The default value of this property is "never". Available on iOS 11 and later. Defaults to `never`.                                                                                                                      | string           | NO       | iOS                 | NO                                                                                              |
| `contentMode?`                                           | Controls the type of content to load. Available on iOS 13 and later. Defaults to `recommended`, which loads mobile content on iPhone & iPad Mini but desktop content on larger iPads.                                                                                                                                            | string           | No       | iOS                 | NO                                                                                              |
| `dataDetectorTypes?`                                     | Determines the types of data converted to clickable URLs in the web view's content. By default only phone numbers are detected.                                                                                                                                                                                                  | string, or array | NO       | ios                 | NO                                                                                              |
| `setBuiltInZoomControls?`                                | Sets whether the WebView should use its built-in zoom mechanisms. The default value is `true`. Setting this to `false` will prevent the use of a pinch gesture to control zooming.                                                                                                                                               | boolean          | NO       | Android             | NO                                                                                              |
| `setDisplayZoomControls?`                                | Sets whether the WebView should display on-screen zoom controls when using the built-in zoom mechanisms (see `setBuiltInZoomControls`). The default value is `false`.                                                                                                                                                            | boolean          | NO       | Android             | NO                                                                                              |
| `directionalLockEnabled?`                                | A Boolean value that determines whether scrolling is disabled in a particular direction. The default value is `true`.                                                                                                                                                                                                            | boolean          | NO       | iOS                 | NO                                                                                              |
| `allowFileAccessFromFileURLs?`                           | Boolean that sets whether JavaScript running in the context of a file scheme URL should be allowed to access content from other file scheme URLs. The default value is `false`.                                                                                                                                                  | boolean          | NO       | iOS, Android, macOS | NO                                                                                              |
| `allowUniversalAccessFromFileURLs?`                      | boolean                                                                                                                                                                                                                                                                                                                          | NO               | No       | iOS, Android, macOS | No                                                                                              |
| `allowingReadAccessToURL`                                | A String value that indicates which URLs the WebView's file can then reference in scripts, AJAX requests, and CSS imports. This is only used in for WebViews that are loaded with a `source.uri` set to a `'file://'` URL. If not provided, the default is to only allow read access to the URL provided in `source.uri` itself. | string           | NO       | iOS and macOS       | NO                                                                                              |
| `keyboardDisplayRequiresUserAction?`                     | If `false`, web content can programmatically display the keyboard. The default value is `true`.                                                                                                                                                                                                                                  | boolean          | NO       | iOS and macOS       | NO                                                                                              |
| `hideKeyboardAccessoryView?`                             | If `true`, this will hide the keyboard accessory view (< > and Done).                                                                                                                                                                                                                                                            | boolean          | NO       | iOS                 | NO                                                                                              |
| `allowsBackForwardNavigationGestures?`                   | If `true`, this will be able horizontal swipe gestures. The default value is `false`.                                                                                                                                                                                                                                            | boolean          | NO       | iOS                 | No                                                                                              |
| `allowFileAccess?`                                       | If `true`, this will allow access to the file system via `file://` URI's. The default value is `false`.                                                                                                                                                                                                                          | boolean          | NO       | Android             | NO                                                                                              |
| `saveFormDataDisabled?`                                  | Sets whether the WebView should disable saving form data. The default value is `false`. This function does not have any effect from Android API level 26 onwards as there is an Autofill feature which stores form data.                                                                                                         | boolean          | NO       | Android             | NO                                                                                              |
| `pagingEnabled?`                                         | If the value of this property is `true`, the scroll view stops on multiples of the scroll view’s bounds when the user scrolls. The default value is `false`.                                                                                                                                                                     | boolean          | NO       | iOS                 | NO                                                                                              |
| `allowsLinkPreview?`                                     | A Boolean value that determines whether pressing on a link displays a preview of the destination for the link. In iOS this property is available on devices that support 3D Touch. In iOS 10 and later, the default value is `true`; before that, the default value is `false`                                                   | boolean          | NO       | iOS and macOS       | NO                                                                                              |
| `sharedCookiesEnabled?`                                  | Set `true` if shared cookies from `[NSHTTPCookieStorage sharedHTTPCookieStorage]` should be used for every load request in the WebView. The default value is `false`. For more on cookies, read the [Guide](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md#Managing-Cookies)             | boolean          | NO       | iOS and macOS       | NO                                                                                              |
| `limitsNavigationsToAppBoundDomains?`                    | If `true` indicates to WebKit that a WKWebView will only navigate to app-bound domains. Only applicable for iOS 14 or greater.                                                                                                                                                                                                   | boolean          | NO       | iOS                 | No                                                                                              |
| `textInteractionEnabled?`                                | If false indicates to WebKit that a WKWebView will not interact with text, thus not showing a text selection loop. Only applicable for iOS 14.5 or greater.                                                                                                                                                                      | boolean          | NO       | iOS                 | NO                                                                                              |
| `suppressMenuItems?`                                     | Allows to suppress menu item from the default context menu.                                                                                                                                                                                                                                                                      | array of strings | NO       | iOS                 | NO                                                                                              |
| `mediaCapturePermissionGrantType?`                       | This property specifies how to handle media capture permission requests. Defaults to `prompt`, resulting in the user being prompted repeatedly. Available on iOS 15 and later.                                                                                                                                                   | string           | NO       | iOS                 | yes                                                                                             |
| `autoManageStatusBarEnabled?`                            | If set to `true`, the status bar will be automatically hidden/shown by WebView, specifically when full screen video is being watched. If `false`, WebView will not manage the status bar at all. The default value is `true`.                                                                                                    | boolean          | NO       | iOS                 | NO                                                                                              |
| `basicAuthCredential`?                                   | object that specifies the credentials of a user to be used for basic authentication.                                                                                                                                                                                                                                             | object           | NO       | iOS, Android        | NO                                                                                              |
| `useWebView2?`                                           | Use WinUI WebView2 control instead of WebView control as the native webview. The WebView2 control is a WinUI control that renders web content using the Microsoft Edge (Chromium) rendering engine. Option can be toggled at runtime and supports Fast Refresh.                                                                  | boolean          | NO       | Windows             | NO                                                                                              |
| `applicationNameForUserAgent?`                           | Append to the existing user-agent. Setting `userAgent` will override this.                                                                                                                                                                                                                                                       | string           | No       | All                 | yes                                                                                             |
| `thirdPartyCookiesEnabled?`                              | Boolean value to enable third party cookies in the `WebView`. Used on Android Lollipop and above only as third party cookies are enabled by default on Android Kitkat and below and on iOS. The default value is `true`.                                                                                                         | boolean          | No       | All                 | yes                                                                                             |
| `menuItems?`                                             | An array of custom menu item objects that will be shown when selecting text. An empty array will suppress the menu                                                                                                                                                                                                               | array of objects | No       | iOS,Android         | yes                                                                                             |
| `paymentRequestEnabled<sup>13.15.1+</sup>`               | Whether or not the webview has the Payment Request API enabled.The default value is `false`.                                                                                                                                                                                                                                     | boolean          | No       | Android             | No                                                                                              |
| `allowsPictureInPictureMediaPlayback<sup>13.15.1+</sup>` | Boolean value that indicates whether HTML5 videos can play Picture in Picture.The default value is `false`.                                                                                                                                                                                                                      | boolean          | No       | Android             | No                                                                                              |
| `refreshControlLightMode<sup>13.15.1+</sup>`             | (ios only) Boolean value that determines whether the refresh control color is white or not.The default value is `false`.                                                                                                                                                                                                         | boolean          | No       | iOS                 | No                                                                                              |
| `indicatorStyle <sup>13.15.1+</sup>`                     | The colorstyle of the scroll indicator.                                                                                                                                                                                                                                                                                          | string           | No       | iOS, Android        | No                                                                                              |

## 5. 事件回调

> [!TIP] "Platform"列表示该属性在原三方库上支持的平台。

> [!TIP] "HarmonyOS Support"列为 yes 表示 HarmonyOS 平台支持该属性；no 则表示不支持；partially 表示部分支持。使用方法跨平台一致，效果对标 iOS 或 Android 的效果。

| Name                                                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                          | Type     | Required | Platform                | HarmonyOS Support |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- | ----------------------- | ----------------- |
| `onScroll?: (event) => void`                                  | Function that is invoked when the scroll event is fired in the `WebView`.                                                                                                                                                                                                                                                                                                                                                            | function | No       | iOS and macOS           | yes               |
| `onHttpError?: (event) => void`                               | Function that is invoked when the `WebView` receives an http error.                                                                                                                                                                                                                                                                                                                                                                  | function | No       | yes                     | yes               |
| `onLoadStart?: (event) => void`                               | Function that is invoked when the `WebView` starts loading.                                                                                                                                                                                                                                                                                                                                                                          | function | No       | All                     | yes               |
| `onLoad?: (event) => void`                                    | Function that is invoked when the `WebView` has finished loading.                                                                                                                                                                                                                                                                                                                                                                    | function | No       | All                     | yes               |
| `onOpenWindow?`                                               | Function that is invoked when the `WebView` should open a new window.                                                                                                                                                                                                                                                                                                                                                                | function | No       | iOS, Android, macOS     | No                |
| `onLoadEnd?: (event) => void`                                 | Function that is invoked when the WebView load succeeds or fails used.                                                                                                                                                                                                                                                                                                                                                               | function | No       | All                     | yes               |
| `onLoadProgress?: (event) => void`                            | Function that is invoked when the WebView is loading.                                                                                                                                                                                                                                                                                                                                                                                | function | No       | All                     | yes               |
| `onMessage?: (event) => void`                                 | Function that is invoked when the webview calls window.ReactNativeWebView.postMessage.                                                                                                                                                                                                                                                                                                                                               | function | No       | iOS,Android,macOS       | yes               |
| `onShouldStartLoadWithRequest?: (event) => void`              | Function that allows custom handling of any web view requests. This feature needs to be used in conjunction with worker threads, and the relevant configuration can be set according to step three of [the worker threads](https://gitcode.com/openharmony-sig/ohos_react_native/blob/master/docs/zh-cn/TurboModule.md#%E8%AE%BE%E7%BD%AE%E8%87%AA%E5%AE%9A%E4%B9%89turbomodule%E8%BF%90%E8%A1%8C%E5%9C%A8worker%E7%BA%BF%E7%A8%8B). | function | No       | iOS,Android,macOS       | yes               |
| `onContentProcessDidTerminate: (event) => void`               | Function that is invoked when the `WebView` content process is terminated.                                                                                                                                                                                                                                                                                                                                                           | function | No       | iOS and macOS WKWebView | No                |
| `renderLoading?`                                              | Function that returns a loading indicator. The `startInLoadingState` prop must be set to `true` in order to use this prop.                                                                                                                                                                                                                                                                                                           | function | No       | iOS, Android, macOS     | No                |
| `onCustomMenuSelection?`                                      | Function called when a custom menu item is selected. It receives a Native event, which includes three custom keys: `label`, `key` and `selectedText`.                                                                                                                                                                                                                                                                                | function | NO       | iOS, Android            | yes               |
| `onNavigationStateChange?: (event) => void`                   | Function that is invoked when the WebView loading starts or ends.                                                                                                                                                                                                                                                                                                                                                                    | function | NO       | iOS, Android            | yes               |
| `onError: (event) => void`                                    | Callback function for handling load errors.                                                                                                                                                                                                                                                                                                                                                                                          | function | NO       | iOS,Android             | yes               |
| `onLoadSubResourceError: (event) => void <sup>13.16.1+</sup>` | Function that is sub resource SSL error handling.                                                                                                                                                                                                                                                                                                                                                                                    | function | NO       | Android                 | yes               |

## 6. 静态方法

> [!TIP] "Platform"列表示该属性在原三方库上支持的平台。

> [!TIP] "HarmonyOS Support"列为 yes 表示 HarmonyOS 平台支持该属性；no 则表示不支持；partially 表示部分支持。使用方法跨平台一致，效果对标 iOS 或 Android 的效果。

| Name                               | Description                                                                                                                                                                                                          | Type     | Required | Platform | HarmonyOS Support |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | -------- | ----------------- |
| `goForward()`                      | Go forward one page in the web view's history.                                                                                                                                                                       | function | No       | All      | yes               |
| `goBack()`                         | Go back one page in the web view's history.                                                                                                                                                                          | function | No       | All      | yes               |
| `reload()`                         | Reloads the current page.                                                                                                                                                                                            | function | No       | All      | yes               |
| `stopLoading()`                    | Stop loading the current page.                                                                                                                                                                                       | function | No       | All      | yes               |
| `injectJavaScript(script: string)` | This function corresponds to the completion handler in Apple's recovery user interface ForPictureInPictureStop. IMPORTANT: This function must be called after calling onRestoreUserInterfaceForPictureInPictureStop. | function | No       | All      | yes               |
| `requestFocus()`                   | Request the webView to ask for focus. (People working on TV apps might want having a look at this!)                                                                                                                  | function | No       | All      | yes               |
| `postMessage(data:string)`         | Post a message to WebView, handled by `onMessage`.                                                                                                                                                                   | function | No       | All      | yes               |
| `clearFormData()`                  | Removes the autocomplete popup from the currently focused form field, if present.                                                                                                                                    | function | No       | Android  | No                |
| `clearCache(status:boolean)`       | Clears the resource cache. Note that the cache is per-application, so this will clear the cache for all WebViews used.                                                                                               | function | No       | All      | yes               |
| `clearHistory()`                   | Tells this WebView to clear its internal back/forward list.                                                                                                                                                          | function | No       | Android  | yes               |

## 7. 遗留问题

- [ ] webview 部分属性未实现 HarmonyOS 化[issue#17](https://gitcode.com/openharmony-sig/rntpc_react-native-webview/issues/17)
- [ ] webview 部分属性未实现 HarmonyOS 化[issue#200](https://github.com/react-native-oh-library/react-native-webview/issues/200)
- [ ] V13.15.1 新增属性未实现 HarmonyOS 化[issue#2](https://gitcode.com/openharmony-sig/rntpc_react-native-webview/issues/2)
- [x] 中文乱码[issue#18](https://github.com/react-native-oh-library/react-native-webview/issues/18)

## 8. 其他

## 9. 开源协议

本项目基于 [The MIT License (MIT)](https://github.com/react-native-webview/react-native-webview/blob/master/LICENSE) ，请自由地享受和参与开源。
