# useDetailFetch Hook 指南

`useDetailFetch` 和 `useOrderDetailFetch` 是用于处理详情页数据请求的自定义 Hook，封装了加载状态、错误处理以及自动请求逻辑。

## 1. 核心功能

- **自动化请求**：监听 `id` 变化，自动触发 `fetcher` 请求。
- **状态管理**：内置 `loading`、`data`、`error` 状态，统一 UI 反馈。
- **异常捕获**：自动处理网络异常及业务错误（`code !== 200`）。
- **手动刷新**：导出 `refresh` 方法，便于下拉刷新或操作后重载。

## 2. API 说明

### useDetailFetch

适用于普通的详情接口（响应结构为 `{ code: 200, data: T }`）。

| 参数      | 类型                                                  | 必填 | 说明                        |
| :-------- | :---------------------------------------------------- | :--- | :-------------------------- |
| `fetcher` | `(params: { id: string }) => Promise<ApiResponse<T>>` | 是   | 执行 API 请求的函数         |
| `id`      | `string`                                              | 是   | 资源 ID。若为空则不触发请求 |

**返回值：** `{ data: T | null, loading: boolean, error: string | null, refresh: () => void }`

### useOrderDetailFetch

适用于特定结构的订单详情接口（响应结构中 `data` 包含 `data` 和 `returnList`）。

**返回值：** 比 `useDetailFetch` 多导出一个 `returnList: any[]`。

## 3. 使用示例

```tsx
import React from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {useDetailFetch} from '@/hooks/useDetailFetch';
import {fetchUserDetail} from '@/services/user';

const UserDetailScreen = ({route}) => {
  const {id} = route.params;

  const {data, loading, error, refresh} = useDetailFetch({
    fetcher: fetchUserDetail,
    id,
  });

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>错误：{error}</Text>;
  if (!data) return <Text>暂无数据</Text>;

  return (
    <View>
      <Text>姓名：{data.name}</Text>
      <Button title="重试" onPress={refresh} />
    </View>
  );
};
```

## 4. 注意事项

- **ID 校验**：Hook 内部会判断 `id` 是否存在，只有在 `id` 为非空字符串时才会发起请求。
- **Fetcher 稳定性**：建议 `fetcher` 传入 service 层定义的原始函数。如果在组件内定义，请务必使用 `useCallback` 包裹，否则会导致无限循环请求。
