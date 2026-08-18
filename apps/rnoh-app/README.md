# RNOH Seed

基于 **React Native 0.82.1 新架构（C-API）** 的跨端应用脚手架，一套代码覆盖 **iOS / Android / HarmonyOS (RNOH 0.82.30)**。

本仓库是**干净的 Seed**：保留导航鉴权、状态持久化、网络层与功能演示，不含具体业务模块。可直接在此基础上扩展自己的页面与接口。

> 原生工程注册名仍为 `SAMRApp`（见 `app.json` / `package.json`），如需改成新品牌名，需同步改三端原生配置与 `AppRegistry` 注册名。

## 架构概览

| 层级           | 技术选型                             | 说明                                                         |
| -------------- | ------------------------------------ | ------------------------------------------------------------ |
| **跨端框架**   | React Native 0.82.1 + RNOH 0.82.30   | New Architecture / C-API 模式，鸿蒙侧通过 RNOH 适配层桥接    |
| **UI 组件**    | Ant Design RN 5.x                    | 企业级组件库，鸿蒙侧配合 `@react-native-ohos/elements`       |
| **样式方案**   | NativeWind + TailwindCSS 3.x         | 原子化 CSS-in-JS，鸿蒙侧通过 `react-native-css-interop` 适配 |
| **导航路由**   | React Navigation 7.x                 | Bottom Tabs + Stack；鸿蒙侧使用 JS Stack 适配                |
| **状态管理**   | Redux Toolkit + redux-persist        | 统一数据流，支持持久化存储                                   |
| **手势动画**   | Gesture Handler 2.x + Reanimated 4.x | 高性能交互动画，双端均有鸿蒙适配包                           |
| **高性能列表** | Shopify FlashList                    | 替代原生 FlatList，优化长列表渲染性能                        |
| **网络层**     | Axios                                | 统一请求拦截，内置全局 Loading 与 Token 鉴权流程             |
| **本地存储**   | AsyncStorage + react-native-fs       | 覆盖 KV 存储与文件系统访问                                   |

**工程化能力：**

- TypeScript 5.x 全量类型约束
- ESLint + Prettier 代码规范配置
- Metro / Babel 构建链，支持 HarmonyOS codegen 产物生成
- patch-package 管理三方库补丁
- 文档体系（Android 运行故障排除、SafeArea 适配、已知问题汇总等）

## Seed 应用结构

```
登录（假登录，无校验）
  └─ Main Tabs
       ├─ 首页：欢迎页
       └─ 我的：个人信息 / 功能演示 / 检查更新 / 退出
            └─ /Me/DevDemo：组件与导航示例栈
```

- **假登录**：账号密码可空，点击登录即可进入（便于本地开发）
- **功能演示**：列表、表单、文件选择/预览、日历、ECharts、导航通信等示例

## 目录说明

- `src/`：业务与脚手架源码
- `harmony/`：鸿蒙原生工程
- `android/`：Android 原生工程
- `ios/`：iOS 原生工程
- `docs/`：开发与排障文档

### `src/` 分层

| 路径              | 说明                                        |
| ----------------- | ------------------------------------------- |
| `src/screens/`    | 页面（`Login` / `Home` / `Me` / `DevDemo`） |
| `src/components/` | 通用 UI 组件                                |
| `src/navigation/` | 路由（Root / Tabs / DevDemo Stack）         |
| `src/services/`   | 网络层（`apiClient` + `baseService`）       |
| `src/store/`      | Redux（`user` / `global` / `app`）          |
| `src/hooks/`      | 自定义 Hooks                                |
| `src/utils/`      | 工具函数                                    |
| `src/theme/`      | 主题与样式系统                              |
| `src/constants/`  | 全局常量                                    |
| `src/types/`      | TypeScript 类型定义                         |
| `src/assets/`     | 图片、字体、图标                            |

### 静态资源

统一放在 `src/assets/`，按类型分目录：

```
src/assets/
  fonts/    # 字体
  icons/    # 图标
  images/   # 通用图片
  login/    # 登录页资源
  tabbar/   # Tab 图标
  static/   # 其它静态图
```

**命名建议：** `页面_用途`，例如 `login_logo.png`。

```tsx
import {Image} from 'react-native';

<Image source={require('@/assets/images/login_logo.png')} />;
```

仅当资源确定只属于某个组件且不会复用时，可放在组件自身目录下。

## 快速开始

### 1. 环境

请先完成 React Native 基础环境（Node、JDK、Android SDK）及鸿蒙开发环境（DevEco Studio）的安装。

### 2. 运行

详细流程见：**[运行操作指南 (README_DEFAULT.md)](README_DEFAULT.md)**

```bash
# 安装依赖
npm install

# 启动 Metro
npm start

# 运行 Android
npm run android

# 运行 iOS
npm run ios

# 运行 HarmonyOS（需先 ohpm install 与 codegen）
cd harmony/entry && ohpm install
cd ../..
npm run codegen
npm run dev
# 再用 DevEco Studio 打开并运行 harmony 目录
```

### 3. 开发参考

- [闪屏替换指南](docs/usage/闪屏替换指南.md)
- [Android 运行故障排除与修复总结](docs/Android运行故障排除与修复总结.md)
- [SafeAreaView 废弃警告修复指南](docs/react-native-safeareaview-deprecation-warning.md)
- [Metro CSS Interop Change Event Crash](docs/rnoh-metro-css-interop-change-event-crash.md)
- [Metro InitializeCore Issue](docs/rnoh-metro-initializecore-issue.md)
- [Metro No Apps Connected Issue](docs/rnoh-metro-no-apps-connected.md)
- [rnoh-spinkit 编译包名冲突问题](docs/rnoh-spinkit-compile-package-name-issue.md)

## Git 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/)，由 `commit-msg` hook 校验。

### 格式

```
<type>(<scope>): <description>
```

### 允许的 type

| Type       | 说明                     |
| ---------- | ------------------------ |
| `feat`     | 新功能                   |
| `fix`      | 修复 bug                 |
| `docs`     | 文档变更                 |
| `style`    | 代码格式（不影响逻辑）   |
| `refactor` | 重构（非新功能、非修复） |
| `perf`     | 性能优化                 |
| `test`     | 测试相关                 |
| `build`    | 构建系统或外部依赖变更   |
| `ci`       | CI 配置变更              |
| `chore`    | 其他杂项                 |
| `revert`   | 回滚提交                 |

### 示例

```bash
git commit -m "feat: add user login page"
git commit -m "fix(auth): resolve token refresh issue"
git commit -m "docs: update seed project readme"
```
