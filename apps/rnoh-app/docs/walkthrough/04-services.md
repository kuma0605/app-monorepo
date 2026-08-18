# 04 — 服务层：API 请求怎么分层

## 分层结构

```
apiClient.ts          ← 底层：axios 实例 + 拦截器 + token 注入
    ↓
baseService.ts        ← 通用：login / uploadFile / getDownloadUrl / getDictList
    ↓
regulationService.ts  ← 核心业务：~78 个端点（企业/投诉/检查/药品/纺织...）
dictService.ts        ← 字典数据
menuService.ts        ← 用户菜单
userService.ts        ← 用户相关
smartRegService.ts    ← SmartReg 模块
```

## apiClient.ts — 请求的"发动机"

所有请求的入口。做了这几件事：

| 功能          | 说明                                      |
| ------------- | ----------------------------------------- |
| baseURL 配置  | 从 `constants/apiConfig.ts` 读            |
| token 注入    | 每次请求从 Redux store 取 token 塞 header |
| 全局 Loading  | 请求计数，>0 时显示全局 loading           |
| 请求/响应日志 | 开发环境打印                              |
| 敏感数据脱敏  | 日志里隐藏 token、密码                    |
| 错误统一处理  | 401 跳登录、网络错误 toast                |

**组件从不直接 `import axios`。** 都走 service 层。

## regulationService.ts — 最大的 service

约 78 个端点，覆盖市场监管全部业务：

| 领域 | 端点举例                                                               |
| ---- | ---------------------------------------------------------------------- |
| 企业 | `findCompanyPage`、`findCompanyById`、`getCompanyLicById`              |
| 投诉 | `findComplaintPage`、`getComplaintInfoById`、`acceptanceForPerson`     |
| 检查 | `dailyInspectionQueryList`、`insertDaily`、`dailyInspectionRecordList` |
| 药品 | `getMedicineCompany`、`uploadMedicinePic`、`getMedicinePic`            |
| 纺织 | `findTextilePage`、`updateTextile`、`uploadCompanyTextilePic`          |
| 员工 | `insertEmploy`、`bindEmployee`、`unbindEmployee`、`queryEmployeeList`  |
| 指令 | `queryDictateList`、`referDictateInfo`、`dictateFeedBack`              |
| 工作 | `findWorkPage`、`findWorkReminderByUserId`、`completeWorkReminderTask` |

每个端点就是一个 `apiClient.post('/xxx', params)` 调用，薄封装。

## 为什么 service 是"薄"的

service 层**不包含业务逻辑**，只做：

1. 定义参数类型（TypeScript）
2. 调用 `apiClient.post/get`
3. 返回 response data

业务逻辑（比如"投诉受理后要刷新列表"）在 **hooks** 或 **screens** 里，不在 service 里。这样 service 可以被任何 hook/screen 复用。

## 请求生命周期

```
组件调用 service.findCompanyPage(params)
  → service 调 apiClient.post('/company/page', params)
  → apiClient 从 Redux 取 token 塞 header
  → axios 发请求
  → 响应回来，apiClient 解包 response.data
  → service 返回纯数据
  → hook 拿到数据，更新本地 state
  → 组件重渲染
```

**token 怎么进去的？** `store/index.ts` 创建 store 时注册了 token provider，apiClient 每次请求前回调取 token。UI 层完全不用管。
