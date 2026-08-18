# 07 — 业务页面：如何组合一切

## 页面地图

| 模块          | 路径                       | 包含内容                                                         |
| ------------- | -------------------------- | ---------------------------------------------------------------- |
| **Home**      | `screens/Home/`            | 7 个待办入口（药品/食品/知识产权/特设/预警/特种用户/许可证过期） |
| **MarketReg** | `screens/MarketReg/`       | 核心监管业务（企业/投诉/检查/健康证/指令/医疗器械/药品/纺织）    |
| **SmartReg**  | `screens/SmartReg/`        | 智慧监管（业务数据/投诉/检查/健康证/订单）                       |
| **Me**        | `screens/Me/`              | 个人中心                                                         |
| **Demo**      | `screens/CalendarDemo/` 等 | 调试页（日历、图表、文件选择）                                   |

## MarketReg — 最大模块

```
screens/MarketReg/
├── company/          企业管理（列表、筛选、详情）
├── complaint/        投诉处理（受理/分配/检查员/结果录入/回访反馈/完成）
├── check/            检查管理（日常检查、日常抽检）
├── healthCertificate/ 健康证（新增/绑定/企业）
├── instruction/      指令管理（拟稿/审批/反馈/结果确认）
├── medicalEquipment/ 医疗器械
├── medicine/         药品
├── textile/          纺织企业
├── inspection/       检查确认（快速/合成/第三方/回退）
├── standardization/  标准化（工作提醒）
├── demoTodoList/      Demo 用（待办列表）
├── pull/              Demo 用（下拉刷新）
└── NavCommDemo*       Demo 用（通用组件）
```

**设计模式**：同类型页面结构几乎一样。比如 complaint 下的 `completion`、`departmentAllocation`、`inspectors`、`resultEntry`、`surveyResults`、`travelFeedback` 六个页面共用：

- `ComplaintDetailScaffold` — 页面骨架
- `ComplaintFormTextArea` — 表单文本域
- `useComplaintDetailScreen` — 统一数据加载 hook
- `complaintDictUtils` — 字典工具

新增一个投诉子流程？复制一个目录，改 service 调用。

## SmartReg — 精简版

和 MarketReg 结构镜像，但页面更精简（只读为主、表单更小）：

```
screens/SmartReg/
├── businessData/basicInfo/  企业基本信息（含子企业列表）
├── complaint/               投诉列表/详情
├── check/                   日常检查
├── healthCertificate/       健康证
├── inspection/              检查确认（快速/合成/第三方）
└── order/                   订单
```

## Home — 首页

```
screens/Home/
├── index.tsx            首页骨架（组合下方 7 个入口 + 样式）
├── HomeTabs.tsx         底部标签栏（iOS/Android）
├── HomeTabs.harmony.tsx 底部标签栏（鸿蒙）
├── styles.ts            首页样式
├── DrugCertificate/     药品证件
├── FoodCertificate/     食品证件
├── FoodUser/            食品用户
├── IntellectualProperty/知识产权
├── PendingWarn/         预警待办（最复杂，556 行，含日历筛选）
├── SpecialExpire/       许可证过期
└── SpecialUser/         特种用户
```

每个入口结构一致：`useFilters` + `usePaginatedList` + `FilterListLayout` 三连。

## Me — 个人中心

```
screens/Me/
└── PersonalInfo/  个人信息（登录/登出、主题切换）
```

最简单的模块，只一个页面。

## 屏幕设计的统一模式

任何列表页都遵循这个模板：

```tsx
function XxxListScreen() {
  // 1. 筛选
  const [filters, setFilters] = useFilters(initialFilters);

  // 2. 数据
  const {data, loading, refresh, loadMore} = usePaginatedList(
    service.findXxxPage,
    filters,
  );

  // 3. 布局
  return (
    <FilterListLayout
      // 搜索 + 筛选插槽
      renderItem={({item}) => <ItemCard />} // 列表项
    />
  );
}
```

**新增列表页 = 4 件事**：换 service、换筛选字段、换 ItemCard、换页面标题。

## 嵌套屏幕（shared）

重复逻辑抽到 `shared/`：

```
MarketReg/complaint/shared/
├── ComplaintDetailScaffold.tsx      ← 页面骨架
├── ComplaintFormTextArea.tsx        ← 多行文本输入
├── ComplaintFormTextAreaField.tsx   ← 单行文本域
├── ComplaintInlineTextInput.tsx     ← 行内文本输入
├── TextMsgEditor.tsx                ← 短信编辑器
├── complaintDetailShared.ts         ← 数据工具（11 个 section 构建器）
├── complaintHotlineTextMsg.ts       ← 热线短信
├── complaintTextAreaConstants.ts    ← 常量
├── formUtils.ts                     ← 表单工具
├── useComplaintDetailScreen.ts      ← 统一数据加载 hook
├── useFormKeyboardScroll.ts         ← 键盘滚动处理
└── formUtils.ts                     ← 表单验证
```

新增投诉子流程？共用这些 shared 组件，写差异化部分。
