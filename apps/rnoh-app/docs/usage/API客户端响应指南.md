# API Client 响应类型说明

本文档记录 `src/services/apiClient.ts` 中 `apiClient.post<T>()` 这类泛型请求方法的类型含义，重点解释为什么登录接口写的是 `apiClient.post<LoginResponseData>()`，但最终返回值仍然可以访问 `response.success`、`response.code`、`response.message`。

---

## 1. 后端统一响应结构

当前后端接口返回的是统一响应包，结构类似：

```ts
{
  success: true,
  code: 200,
  message: 'success',
  data: {
    token: '...',
    user: {
      id: 1,
      name: '管理员',
      account: 'admin',
    },
  },
}
```

这里有两层需要区分：

- 外层响应包：`success`、`code`、`message`、`data`。
- 内层业务数据：外层 `data` 里的实际业务内容，比如登录接口的 `token` 和 `user`。

---

## 2. `ApiResponse<T>` 的含义

项目里的通用响应类型定义在 `src/types/common.types.ts`：

```ts
export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  code: number;
}
```

`T` 只表示外层响应包里的 `data` 类型，不表示整个 response。

例如：

```ts
ApiResponse<LoginResponseData>;
```

展开后可以理解为：

```ts
{
  success: boolean;
  code: number;
  message: string;
  data: LoginResponseData;
}
```

如果接口失败时 `data` 可能是 `null`，就写成：

```ts
ApiResponse<LoginResponseData | null>;
```

展开后就是：

```ts
{
  success: boolean;
  code: number;
  message: string;
  data: LoginResponseData | null;
}
```

---

## 3. 为什么 `apiClient.post<T>()` 只传业务 data 类型

`apiClient` 内部已经把 Axios 的响应拆了一层：

```ts
const response = await axiosClient.request<ApiResponse<T>>(axiosConfig);
return response.data;
```

Axios 原始响应大概是：

```ts
{
  status: 200,
  headers: {},
  data: {
    success: true,
    code: 200,
    message: 'success',
    data: {
      token: '...',
      user: {},
    },
  },
}
```

`apiClient` 返回的是 Axios 的 `response.data`，也就是后端统一响应包：

```ts
{
  success: true,
  code: 200,
  message: 'success',
  data: {
    token: '...',
    user: {},
  },
}
```

所以调用时：

```ts
const response = await apiClient.post<LoginResponseData | null>('/login/sso', {
  username,
  password,
});
```

实际类型等价于：

```ts
const response: ApiResponse<LoginResponseData | null>;
```

因此：

```ts
response.success; // boolean
response.code; // number
response.message; // string
response.data; // LoginResponseData | null
```

---

## 4. 登录接口示例

登录接口的业务数据可以定义为：

```ts
interface LoginUser {
  id: number;
  name: string;
  account: string;
  phone: string;
}

interface LoginResponseData {
  token?: string;
  user?: LoginUser;
  refreshToken?: string | null;
}
```

调用时只把业务数据类型传给泛型：

```ts
const response = await apiClient.post<LoginResponseData | null>('/login/sso', {
  username,
  password,
});

if (response.success && response.data) {
  const accessToken = response.data.token;
}
```

不要把完整外层结构再包一遍：

```ts
// 不推荐：这里会导致 data 被重复嵌套一层
apiClient.post<ApiResponse<LoginResponseData>>('/login/sso', payload);
```

---

## 5. 命名建议

为了避免误解，接口业务数据类型可以优先使用这些名字：

- `LoginData`
- `LoginPayload`
- `LoginResult`

如果使用 `LoginResponseData`，需要记住它表示的是后端响应包里的 `data` 字段，而不是整个 response。
