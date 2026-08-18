# Monorepo 与跨端代码共享方案

## 背景

当前有两个独立项目，面向不同平台：

| 项目 | 技术栈 | 目标平台 |
|------|--------|----------|
| `miniapp` | Taro 4 + React + Redux | 微信小程序、H5 |
| `rnoh-app` | RN 0.82 + RNOH + RTK | Android、iOS、HarmonyOS |

两个项目对接**同一套后端 API**，有大量可复用的业务逻辑（类型定义、接口封装、状态管理、工具函数等），但 UI 层和平台能力完全不同。

---

## 什么是 Monorepo

Monorepo（单体仓库）= **把多个相关项目放在同一个 Git 仓库里管理**。

```
一个仓库
├── apps/
│   ├── miniapp/          # 小程序/H5
│   └── rnoh-app/         # 跨端 App
└── packages/
    └── shared/           # 共用代码
```

核心机制是包管理器的 **workspace**（pnpm / yarn / npm 都支持）：
- 让 `shared` 成为一个"内部 npm 包"
- `miniapp` 和 `rnoh-app` 像引用普通 npm 包一样 `import { xxx } from '@app/shared'`
- 改了 `shared` 里的代码，两端同时生效，不用发版、不用复制粘贴

---

## 能共用什么、不能共用什么

### 可以共用（放进 shared）

这些代码**不依赖任何平台 API**，是纯 TypeScript 逻辑：

| 模块 | 说明 | 来源 |
|------|------|------|
| `types/` | `ApiResponse`、`UserInfo`、`PaginatedParams` 等接口定义 | rnoh 已有 |
| `constants/` | API 地址、超时配置、HTTP 状态码、业务枚举 | rnoh 已有 |
| `utils/` | `format.ts`（日期/金额格式化）、`tree.ts`（树操作）、`dict.ts`（字典处理）| rnoh 已有 |
| `services/` | 业务 API 函数（登录、列表、上传等），依赖抽象的 `HttpClient` 接口 | 需重构 |
| `store/slices/` | Redux Toolkit slices（`userSlice`、`globalSlice` 等）| rnoh 已有 |

### 不能共用（各端自己实现）

| 模块 | 原因 |
|------|------|
| UI 组件 / 页面 | Taro 组件（`View/Button`）≠ RN 组件（`View/Pressable`）|
| 导航/路由 | Taro 页面栈 ≠ React Navigation |
| 网络底层 | 小程序用 `Taro.request`，App 用 `axios` |
| 本地存储 | 小程序用 `Taro.setStorage`，App 用 `AsyncStorage` |
| 原生能力 | 文件、权限、推送、相机等，平台 API 完全不同 |

---

## 推荐方案：轻量 shared 包

新建一个 `shared` 包，两边通过 workspace 引用：

```
app-monorepo/
├── packages/
│   └── shared/                    # 共享包
│       ├── package.json           # { "name": "@app/shared" }
│       ├── tsconfig.json
│       └── src/
│           ├── types/              # 接口/业务类型
│           │   ├── common.types.ts
│           │   └── api.types.ts
│           ├── constants/          # API 地址、枚举
│           │   └── apiConfig.ts
│           ├── utils/              # 纯函数工具
│           │   ├── format.ts
│           │   ├── tree.ts
│           │   └── dict.ts
│           ├── http/               # HttpClient 抽象接口
│           │   └── types.ts
│           ├── services/           # 业务 API（依赖 HttpClient 接口）
│           │   └── baseService.ts
│           └── store/              # Redux Toolkit slices
│               └── slices/
│                   ├── userSlice.ts
│                   └── globalSlice.ts
│
└── apps/
    ├── miniapp/                    # 小程序/H5
    │   ├── package.json            # 加 "@app/shared": "workspace:*"
    │   └── src/
    │       ├── adapters/           # 平台适配器
    │       │   ├── http.ts         # Taro.request → HttpClient
    │       │   └── storage.ts      # Taro.setStorage → Storage
    │       └── pages/              # Taro UI 页面
    │
    └── rnoh-app/                   # 跨端 App
        ├── package.json            # 加 "@app/shared": "workspace:*"
        └── src/
            ├── adapters/           # 平台适配器
            │   ├── http.ts         # axios → HttpClient（包装现有 apiClient）
            │   └── storage.ts      # AsyncStorage → Storage
            └── screens/            # RN UI 页面
```

### 两端引用方式

在各自的 `package.json` 中添加：

```json
{
  "dependencies": {
    "@app/shared": "workspace:*"
  }
}
```

然后业务代码中：

```typescript
import { ApiResponse, UserInfo } from '@app/shared/types'
import { formatDate } from '@app/shared/utils'
import { createBaseService } from '@app/shared/services'
```

---

## 关键设计：HttpClient 抽象接口

当前 RNOH 的 `apiClient.ts` 直接绑定了 axios。要让 services 层共用，需要抽出一个平台无关的接口：

```typescript
// shared/src/http/types.ts

export interface HttpClient {
  get<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>>
  post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  delete<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>>
}

export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  noLoading?: boolean
  params?: Record<string, unknown>
}
```

**miniapp 适配器**（用 Taro.request 实现）：

```typescript
// miniapp/src/adapters/http.ts
import Taro from '@tarojs/taro'
import type { HttpClient, ApiResponse } from '@app/shared'

export function createTaroHttpClient(baseURL: string): HttpClient {
  return {
    async get<T>(path: string, config?) {
      const res = await Taro.request<ApiResponse<T>>({
        url: baseURL + path,
        method: 'GET',
        header: config?.headers,
        timeout: config?.timeout,
      })
      return res.data
    },
    async post<T>(path: string, body?: unknown, config?) {
      const res = await Taro.request<ApiResponse<T>>({
        url: baseURL + path,
        method: 'POST',
        data: body,
        header: config?.headers,
      })
      return res.data
    },
    // put, delete 类似...
  }
}
```

**RNOH 适配器**（包装现有 axios apiClient）：

```typescript
// rnoh-app/src/adapters/http.ts
import { apiClient } from '../services/apiClient'
import type { HttpClient } from '@app/shared'

// 现有 apiClient 已经符合 HttpClient 接口，直接导出即可
export const httpClient: HttpClient = apiClient
```

**shared 里的 services 只依赖接口**：

```typescript
// shared/src/services/baseService.ts
import type { HttpClient } from '../http/types'
import type { UploadResult, AppVersion } from '../types/api.types'

export function createBaseService(http: HttpClient) {
  return {
    uploadFile: (formData: FormData) =>
      http.post<UploadResult>('/file/upload', formData),

    getLastAppVersion: (config?) =>
      http.post<AppVersion>('/sys/versionApp/getLastAppVersion', undefined, config),
  }
}
```

---

## 状态管理统一

建议 miniapp 也迁移到 Redux Toolkit（和 RNOH 对齐），这样 slices 可以直接共用：

- `userSlice`（登录态、token、profile）
- `globalSlice`（loading 状态等）

miniapp 侧的 store 初始化：

```typescript
// miniapp/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { userReducer, globalReducer } from '@app/shared/store'

export const store = configureStore({
  reducer: {
    user: userReducer,
    global: globalReducer,
  },
})
```

RNOH 侧保持现有逻辑，只是把 slice 定义移到 shared。

---

## 迁移步骤

| 步骤 | 内容 | 预估工作量 |
|------|------|-----------|
| 1 | 新建 `packages/shared/`，搬入 `types/` + `constants/` + 纯 `utils/` | 0.5 天 |
| 2 | 定义 `HttpClient` 接口，RNOH 侧包装现有 axios | 0.5 天 |
| 3 | miniapp 侧写 Taro 版 HttpClient 适配器 | 0.5 天 |
| 4 | 迁 `services/` 到 shared，两端注入各自的 httpClient | 1 天 |
| 5 | 迁 RTK slices 到 shared，miniapp 切换到 RTK | 1 天 |
| 6 | 新功能统一在 shared 写逻辑，各端只写 UI | 持续 |

**总启动成本：约 3 天**，之后每个新功能省下的重复工作会迅速回本。

---

## 核心原则

```
shared 包 = 业务逻辑 + 类型定义 + 数据层
各端 app  = UI 渲染 + 平台适配器
```

- 登录：shared 定义 `login()` API + `userSlice`；miniapp 写 Taro 登录页，RNOH 写 RN 登录 Screen
- 列表页：shared 定义 `getList()` + 分页类型；各端用自己的列表组件渲染
- 新增 API：只在 shared 加一个 service 函数，两端直接调用

**不要试图共用 UI 或路由**——收益低、复杂度高。共用的是「和后端说什么、数据怎么存、怎么格式化」。

---

## 后续可选升级

1. 在根目录维护 `pnpm-workspace.yaml`
2. 把应用放在 `apps/` 下，公共模块放在 `packages/` 下
3. 统一 tsconfig / eslint / CI 配置
