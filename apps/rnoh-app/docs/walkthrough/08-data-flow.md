# 08 — 完整数据流：一次请求的生命周期

以"用户打开某投诉列表页，翻到第二点，点进详情，提交一条处理意见"为例，走完整个 src。

## ① 页面挂载

```
navigation/rootStackScreenRegistry.tsx   lazy 注册了 ComplaintList
用户点首页"投诉"入口
  → useNavigation().navigate('ComplaintList')
  → rootStack 动态加载 complaint/list/index.tsx
```

## ② 列表加载

```
ComplaintList.tsx
  → useFilters(initialFilters)                   // 筛：状态字典
  → usePaginatedList(service.findComplaintPage)  // 数据：投诉分页
  → FilterListLayout                            // 布局：搜索+筛选+列表
      ↓
  usePaginatedList 内部：
    → service.findComplaintPage(filters)
      → apiClient.post('/complaint/page', filters)
        → 从 Redux store 取 token 塞 header
        → axios 发请求
      → 返回 data.list, data.total
    → { data, loading, refresh, loadMore }
```

**组件不需要知道 token 在哪、loading 怎么算** — hook + service + apiClient 全包了。

## ③ 翻页

```
用户上拉
  → FlatList onEndReached 触发
  → usePaginatedList.loadMore()
  → service.findComplaintPage({...filters, page: 2})
  → 数据追加到 data 数组
  → 列表自动增长
```

## ④ 进入详情

```
用户点某条投诉
  → useNavigation().navigate('ComplaintDetail', { id: 123 })
  → complaint/detail/index.tsx 挂载
  → useComplaintDetailScreen(id) 统一 hook
    → service.getComplaintInfoById(id)  // 拉详情
    → service.getDictList(...)           // 拉字典
    → 组合成页面需要的数据结构
  → ComplaintDetailScaffold 渲染表单
    → ComplaintInfoDetails（只读展示）
    → ComplaintFormTextArea（可填写）
```

## ⑤ 提交处理意见

```
用户填完表单，点提交
  → formUtils.validate()                    // 本地校验
  → service.acceptanceForPerson(formData)    // 调 API
    → apiClient.post('/complaint/accept', formData)
      → token 自动注入
      → 全局 Loading 计数+1，显示 spinner
      → 请求发送
    → 响应回来，Loading 计数-1
  → showToast('提交成功')
  → navigation.goBack()   // 回到列表
  → 列表页 onFocus 触发 refresh()
    → usePaginatedList.refresh()
    → 重新拉第一页
    → 新数据显示
```

## ⑥ 数据流全景图

```
┌──────────────────────────────────────────────────────┐
│                    Screen 组件                        │
│  useAppSelector(读)  ←─────── store ───────→  useAppDispatch(写) │
│  usePaginatedList(数据)     │        dispatch(action)          │
│  useFilters(筛选)           │                                  │
└──────────────┬───────────────┼──────────────────┬──────────────┘
               │               │                  │
        services层            │              slices层
   ┌───────────────┐         │         ┌────────────────┐
   │ apiClient.ts  │         │         │ userSlice.ts   │
   │ baseService   │         │         │ menuSlice.ts   │
   │ regulationSvc │         │         │ appSlice.ts    │
   │ dictService   │         │         │ refDataSlice   │
   │ menuService   │         │         │ globalSlice    │
   └───────┬───────┘         │         └────────────────┘
           │                 │
      HTTP 请求          token provider
           │            (store 创建时注册)
           │                 │
      后端 API ◄─────────────┘
```

## ⑦ 流方向总结

| 方向     | 路径                                     | 说明                        |
| -------- | ---------------------------------------- | --------------------------- |
| **读**   | store → selector → 组件                  | 单向，不反向写              |
| **写**   | 组件 → dispatch → reducer → store        | 通过 action，不直接改 state |
| **请求** | 组件 → hook → service → apiClient → HTTP | 四层层层委托                |
| **响应** | HTTP → apiClient → service → hook → 组件 | 回调式，逐层解包            |
| **导航** | registry → rootStack → screen            | 懒加载，按平台分流          |
| **状态** | 屏幕间只传 id，各自从 store 查           | 不直接传业务对象            |

## 第八层以外的代码

| 层              | 什么时候生效                                   |
| --------------- | ---------------------------------------------- |
| Build & Tooling | 构建时（metro/babel 打包），不进运行时         |
| Native Platform | App 启动时原生壳加载 JS bundle，不进 JS 运行时 |
| Documentation   | 人读的，机器不读                               |

## 读完这一系列你应该能回答

1. 新增一个列表页要改哪些文件？**答：screens/ 下一个目录 + service 加个端点（如果没有）**
2. token 怎么进请求头的？**答：apiClient 从 store 取，UI 不管**
3. 屏幕之间怎么传数据？**答：只传 id，各自从 store 查**
4. 三端差异怎么处理？**答：文件后缀（.harmony.tsx），不用 if/else**
5. MarketReg 和 SmartReg 什么关系？**答：结构镜像，SmartReg 是精简版**

没找到答案？回到 [00-overview.md](./00-overview.md) 看目录，跳到对应篇。
