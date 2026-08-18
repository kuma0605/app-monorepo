# Android 运行故障排除与修复总结

在进行 `npm run android` 启动项目时，由于 Gradle 版本（Gradle 9.0）以及 React Native 版本（0.82）的升级，遇到了一系列依赖库的编译与构建问题。以下是故障表现、原因及对应的修复记录。

---

## 1. `react-native-spinkit` 中的 `jcenter()` 方法未找到

### 问题表现

```
* Where:
Build file '/Users/dylan/CodeHub/SAMRApp/node_modules/react-native-spinkit/android/build.gradle' line: 7

* What went wrong:
A problem occurred evaluating project ':react-native-spinkit'.
> Could not find method jcenter() for arguments [] on repository container of type org.gradle.api.internal.artifacts.dsl.DefaultRepositoryHandler.
```

### 问题原因

Gradle 9.0 彻底移除了废弃的 `jcenter()` 仓库方法。

### 修复方法

1. 修改 `node_modules/react-native-spinkit/android/build.gradle` 中的仓库配置，将所有的 `jcenter()` 替换为 `mavenCentral()`。
2. 在项目根目录下运行 `npx patch-package react-native-spinkit` 保存为此依赖的本地补丁：
   - 补丁路径：`patches/react-native-spinkit+1.5.1.patch`

---

## 2. `react-native-document-picker` 编译找不到 `GuardedResultAsyncTask`

### 问题表现

```
/Users/dylan/CodeHub/SAMRApp/node_modules/react-native-document-picker/android/src/main/java/com/reactnativedocumentpicker/RNDocumentPickerModule.java:21: error: cannot find symbol
import com.facebook.react.bridge.GuardedResultAsyncTask;
                                ^
  symbol:   class GuardedResultAsyncTask
  location: package com.facebook.react.bridge
```

### 问题原因

在新版本 React Native（从 0.73 之后）中，`GuardedResultAsyncTask` 类已被彻底移除（框架已向 Kotlin 及协程/线程池方向迁移），导致直接引用它的第三方库编译失败。

### 修复方法

1. 在 `RNDocumentPickerModule.java` 中删除了失效的 `import com.facebook.react.bridge.GuardedResultAsyncTask;`。
2. 引入 `com.facebook.react.bridge.JSExceptionHandler`。
3. 在类中本地实现了一个 `GuardedResultAsyncTask` 的抽象基础类，用于接管原有的异步逻辑和异常处理，代码如下：

   ```java
   private static abstract class GuardedResultAsyncTask<Result> extends android.os.AsyncTask<Void, Void, Result> {
     private final JSExceptionHandler exceptionHandler;

     protected GuardedResultAsyncTask(JSExceptionHandler exceptionHandler) {
       this.exceptionHandler = exceptionHandler;
     }

     @Override
     protected final Result doInBackground(Void... params) {
       try {
         return doInBackgroundGuarded();
       } catch (RuntimeException e) {
         exceptionHandler.handleException(e);
         throw e;
       }
     }

     @Override
     protected final void onPostExecute(Result result) {
       try {
         onPostExecuteGuarded(result);
       } catch (RuntimeException e) {
         exceptionHandler.handleException(e);
       }
     }

     protected abstract Result doInBackgroundGuarded();
     protected abstract void onPostExecuteGuarded(Result result);
   }
   ```

4. 运行 `npx patch-package react-native-document-picker` 保存本地补丁。
   - 补丁路径：`patches/react-native-document-picker+9.3.1.patch`

---

## 3. 编译时出现 Duplicate Class 重复类冲突

### 问题表现

```
Execution failed for task ':app:checkDebugDuplicateClasses'.
> A failure occurred while executing com.android.build.gradle.internal.tasks.CheckDuplicatesRunnable
   > Duplicate class android.support.v4.app.INotificationSideChannel found in modules core-1.17.0.aar -> core-1.17.0-runtime (androidx.core:core:1.17.0) and support-compat-26.1.0.aar -> support-compat-26.1.0-runtime (com.android.support:support-compat:26.1.0)
```

### 问题原因

项目中的某些旧包依旧使用了传统的 `android.support` 库，而 React Native 及其它较新的依赖已经全面迁移至了 `androidx`，两者在打包阶段会导致类冲突。

### 修复方法

在项目的 `android/gradle.properties` 配置文件中添加并启用 Jetifier 功能：

```properties
android.useAndroidX=true
android.enableJetifier=true
```

启用后，构建工具链在编译时会自动将旧版的 support 库转换成对应的 AndroidX 版本，彻底消除了重复类冲突。

---

## 4. Android 11+ 预览文件报 `No app associated with this mime type`

### 问题表现

在 Android 虚拟机或真机上，文件选择上传图片（png、jpg）或 PDF 成功后点击预览，提示：
`预览失败: No app associated with this mime type`

### 问题原因

从 Android 11 (API Level 30) 开始，系统引入了严格的**包可见性限制 (Package Visibility)**。`react-native-file-viewer` 插件在原生端会通过 `PackageManager.resolveActivity` 来判断系统中是否有能够处理特定 MIME 类型的 App。如果当前应用未在清单文件中通过 `<queries>` 标签显式声明，系统为了隐私安全会直接拦截该查询并返回 `null`，导致插件误以为没有关联应用而抛出上述异常。

### 修复方法

在 `android/app/src/main/AndroidManifest.xml` 的 `<manifest>` 根标签下添加 `<queries>` 标签，显式声明需要查询的意图，使应用可以检测并调起系统内安装的图片浏览器和文件浏览器：

```xml
    <!-- Android 11+：FileViewer / DocumentPicker 包可见性 -->
    <queries>
      <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:mimeType="*/*" />
      </intent>
      <intent>
        <action android:name="android.intent.action.GET_CONTENT" />
      </intent>
      <intent>
        <action android:name="android.intent.action.OPEN_DOCUMENT" />
      </intent>
    </queries>
```

---

## 总结

通过以上四项修改，项目在 Gradle 9.0 和 React Native 0.82 架构下成功通过编译，消除了安卓 11+ 系统上的包可见性拦截，确保了文件预览及选择功能完全正常工作，并能够顺利将 Android 应用发布部署至模拟器或真机。
