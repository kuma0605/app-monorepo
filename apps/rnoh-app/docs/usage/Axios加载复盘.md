# 一次跨端 Loading 卡死复盘：把请求计数从 Axios 拦截器迁到 try/catch/finally

本文记录一次跨端项目里的典型问题：**全局 Loading 偶发卡死**。最终修复的关键点很简单——把“请求计数”的加减从 Axios 拦截器迁移到 `request()` 的 `try/catch/finally` 内，由 `finally` 兜底保证对称收口。

> 代码落地位置：
>
> - 请求封装：`src/services/apiClient.ts`
> - 全局 Loading 方案说明：`docs/usage/全局加载方案.md`

---

## 1. 背景：我们在数什么，为什么会“卡死”

为了实现全局 Loading（顶层遮罩），我们维护一个全局计数器 `requestCount`：

- **请求开始**：`requestCount += 1`
- **请求结束（成功/失败）**：`requestCount -= 1`
- **展示规则**：
  - `0 → 1`：打开 Loading
  - `1 → 0`：关闭 Loading

这个机制的硬约束只有一句话：**加减必须严格对称**。一旦出现“+1 没有对应 -1”，`requestCount` 永远回不到 0，Loading 就会一直挂着（也就是“卡死”）。

---

## 2. 现象：App 端偶发“遮罩不消失”

同一套业务逻辑在 Web 侧长期正常，但在 App 端（跨端运行环境）偶发出现：

- 接口已经失败（断网 / 弱网 / 超时等），业务提示也弹出了
- **全局遮罩仍然存在**，像是还有请求在进行
- 往往需要返回重进、或等待后续请求“碰巧”把状态带回正常

这类问题的共同点是：通常出现在**非理想网络与异常路径**，并且复现不稳定。

---

## 3. 初版实现：把计数放在 Axios 拦截器里

最初我们把计数放在 Axios 拦截器里统一接管生命周期（典型写法如下）：

```ts
axiosClient.interceptors.request.use(config => {
  show(); // requestCount++
  return config;
});

axiosClient.interceptors.response.use(
  res => {
    hide(); // requestCount--
    return res;
  },
  err => {
    hide(); // requestCount--
    return Promise.reject(err);
  },
);
```

当时它看起来很合理：

- **集中**：所有请求自动纳管
- **业务无感**：业务侧无需写 finally
- **统一**：token/header/日志/计数都在一个地方处理

---

## 4. 排查：先确认根因是“计数漏减”

为了避免误判（UI/Redux/Modal 层级也可能导致“看起来像卡死”），排查顺序建议固定为：

- **验证 UI 链路**：手动切换全局 `isLoading`（true/false）看遮罩能否正常开关
- **验证计数对称**：在 show/hide 打日志，记录 `requestCount` 与请求标识（method、url、耗时、错误类型）

当确认出现 `requestCount` 长期不回 0，基本可以锁定：**对称性在某条异常路径上被破坏了**。

---

## 5. 根因：拦截器不是可靠的“收尾点”，错误归一化会放大风险

随着封装演进，我们在请求层做了**错误归一化**（将 Axios 错误转换为更明确的业务异常），例如：

- `TimeoutError`：超时（如 `ECONNABORTED`）
- `ApiError`：有响应、有状态码、有后端错误信息
- `NetworkError`：无响应的断网/网络不可达等

这一步本身是对的，但它带来一个现实风险：

- **计数在拦截器阶段加减**，但 **错误被封装层转换/重抛**
- 跨端环境下错误形态更多（弱网、取消、底层差异），拦截器链路不一定按你预期闭环
- 结果可能出现：`show()` 发生了，但某条路径上的 `hide()` 没发生 → `requestCount` 回不到 0 → Loading 卡死

经验总结：

- **拦截器更适合做“可重入的改写/注入”**（token/header/日志）
- **“必须严格配对”的逻辑应放在调用边界收口**（计数/锁/资源释放）

而最可靠的“调用边界收口”就是：`try/finally`。

---

## 6. 修复：把计数从拦截器迁到 request() 的 try/catch/finally

迁移后的原则是：**谁负责 +1，就必须在同一个调用边界里保证 -1**。

### 6.1 新方案的结构（核心是 finally）

```ts
async function request(config) {
  const usesLoading =
    !config.noLoading && config.headers?.['x-no-loading'] !== 'true';
  if (usesLoading) show(); // requestCount++

  try {
    const res = await axiosClient.request(config);
    return res.data;
  } catch (e) {
    // 在这里可以自由做错误归一化/重抛：ApiError / NetworkError / TimeoutError...
    throw normalizeError(e);
  } finally {
    // 关键：无论成功/失败/如何重抛，finally 都会执行
    if (usesLoading) hide(); // requestCount--
  }
}
```

### 6.2 为什么 finally 比拦截器更“稳”

`finally` 的价值在于：**不依赖外部链路、也不依赖错误形态**。无论 `catch` 里把错误转换成什么类型、抛出什么异常，`finally` 都会执行，从机制上消灭“漏减计数”的空间。

---

## 7. 迁移后顺手补齐的两个并发体验问题（建议一起做）

只解决“对称性”还不够，真实体验里还会遇到两个常见问题，我们建议一起处理：

### 7.1 防闪烁：最短展示时间（MIN_VISIBLE_MS）

请求很快时，Loading 会“闪一下”，体验很差。做法是：

- 记录 `lastShownAt`
- 关闭时如果展示不足最短时间，就延迟关闭到满足最短展示

### 7.2 防竞态：延迟关闭要可取消 + 二次检查

延迟关闭通常用 `setTimeout`。并发场景下，如果不处理竞态，很容易出现：

- 旧请求安排了延迟关闭
- 新请求又开始了
- 旧的关闭定时器触发，把新请求的 Loading 误关掉

工程化做法：

- **新请求开始时**取消旧的 `hideTimer`
- **定时器触发时**再检查一次 `requestCount === 0` 才真正关闭

这些细节在当前实现 `src/services/apiClient.ts` 中已经包含。

---

## 8. 结果与结论（推荐写在文章结尾）

本次修复的关键不是“换了个写法”，而是把“必须严格配对”的逻辑从不确定的链路阶段（拦截器）迁移到确定性收口点（`finally`）。

最终结论可以浓缩为三句：

- **拦截器适合做改写/注入，不适合做严格配对的收尾**
- **计数、锁、资源释放这类逻辑，应在调用边界用 finally 收口**
- **跨端 + 错误归一化的组合，会放大所有“链路对称性假设”的风险**

---

## 9. 项目内参考实现

- 全局 Loading 设计说明：`docs/usage/全局加载方案.md`
- 请求封装与错误归一化：`src/services/apiClient.ts`
