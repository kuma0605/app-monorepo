# 06 — UI 组件库：可复用的展示层

## 组件清单

| 组件                                          | 路径                                              | 用途                                      |
| --------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| **DaDropdown**                                | `components/DaDropdown/`                          | 下拉菜单套件（筛选/排序/日期范围/选择器） |
| **DaDropdownPicker**                          | `components/DaDropdownPicker/`                    | 树形/列式选择器                           |
| **FilterListLayout**                          | `components/FilterListLayout/`                    | "搜索栏 + 筛选 + 列表" 一体式布局         |
| **InfoDetails**                               | `components/InfoDetails/`                         | 详情信息展示（只读表单）                  |
| **ComplaintInfoDetails**                      | `components/InfoDetails/ComplaintInfoDetails.tsx` | 投诉详情专用展示                          |
| **DetailSection**                             | `components/DetailSection.tsx`                    | 可折叠详情分组                            |
| **StickyNotice**                              | `components/StickyNotice.tsx`                     | 顶部吸顶提示条                            |
| **checklist**                                 | `components/checklist/`                           | 检查表（射频组）                          |
| **HeaderSearch**                              | `components/HeaderSearch/`                        | 搜索栏（含暗黑模式）                      |
| **UploadFileCard / UploadPreviewImage**       | `components/`                                     | 文件上传卡片 + 图片预览                   |
| **PlatformButton**                            | `components/PlatformButton/`                      | 三端适配按钮                              |
| **LoadingOverlay / ListFooter / MarqueeText** | `components/`                                     | 加载遮罩 / 列表底部 / 跑马灯文本          |
| **PaginatedListScrollToTopFab**               | `components/`                                     | 返回顶部悬浮按钮                          |
| **complaintList**                             | `components/complaintList/`                       | 投诉列表状态文本                          |

## DaDropdown — 最复杂的组件

文件夹结构：

```
components/DaDropdown/
├── DaDropdown.tsx       ← 主入口（渲染菜单栏 + Portal 弹窗）
├── DropdownCell.tsx     ← 单元格下拉
├── DropdownFilter.tsx   ← 筛选面板
├── DropdownPicker.tsx   ← 选择器面板
├── DropdownDaterange.tsx← 日期范围面板
├── PartDropdownFooter.tsx← 底部重置/确认按钮
├── types.ts             ← 所有类型定义（联合类型 Discriminated Union）
├── utils.ts             ← 共享工具函数
├── slotMenuUtils.ts     ← 插槽菜单逻辑
└── confirmOptions.ts    ← 确认选项
```

`types.ts` 定义了 `DropdownMenuItem` 联合类型 — 所有其他文件都 import 它。`utils.ts` 和 `slotMenuUtils.ts` 是每个面板都会调用的共享逻辑。

**设计思路**：DaDropdown 不是一个组件，而是一个**套件**。通过 `DropdownMenuItemType` 区分不同面板类型，统一入口，分文件实现。

## FilterListLayout — 列表页的"骨架"

几乎所有列表页都基于它：

```
┌─────────────────────────────┐
│  SearchBar（搜索栏）         │  ← HeaderSearch
├─────────────────────────────┤
│  FilterSlot（筛选插槽）      │  ← DaDropdown 系列
├─────────────────────────────┤
│  List（列表内容）            │  ← FlashList / FlatList
│  ...                        │
└─────────────────────────────┘
```

套一个 `FilterListLayout`，定义好 `renderItem` 和筛选字段，列表页就完成了。

## 平台适配规则

用**文件后缀**而非运行时判断：

```
PlatformButton/index.tsx         ← iOS（默认）
PlatformButton/index.android.tsx ← Android
PlatformButton/index.harmony.tsx ← 鸿蒙
```

React Native 打包器根据平台自动选文件，零运行时开销，零 if/else。

## 组件设计原则

1. **不持有业务数据** — 数据从 props 进来，事件从 props 出去
2. **不直接调 service** — 组件不调 API，hook 调
3. **不引用 screen** — 组件不知道自己在哪个页面被使用
4. **样式走 theme** — 颜色/间距从 `useTheme()` 拿，不写魔数
