# FlatList 性能优化指南

在 React Native 开发中，`FlatList` 是处理长列表的最常用组件。虽然它内置了虚拟化（Virtualization）功能，但在处理复杂列表或大数据量时，如果配置不当，依然会出现掉帧、白块或卡顿现象。

本文旨在帮助你理解 `FlatList` 的性能瓶颈，并提供针对性的优化策略。

## 1. 为什么 `FlatList` 会卡顿？

- **JS 线程瓶颈**：`FlatList` 的渲染计算发生在 JS 线程。如果滑动过快，JS 线程来不及计算哪些 Item 需要显示，就会出现白块。
- **渲染压力**：如果 Item 组件非常复杂且没有使用 `React.memo`，每次列表更新都会导致大量不必要的重绘。
- **内存积压**：默认配置下，`FlatList` 可能会保留较多屏幕外的组件实例，导致内存占用持续上升。

## 2. 核心优化参数 (必做)

### 2.1 使用 `getItemLayout` (最有效的优化)

如果你能确定列表项（Item）的高度（或宽度），**强烈建议**使用此参数。它能跳过测量动态布局的步骤。

```tsx
<FlatList
  data={data}
  getItemLayout={
    (data, index) => ({
      length: 100,
      offset: 100 * index,
      index,
    }) // 假设高度固定为 100
  }
/>
```

### 2.2 优化 `windowSize`

`windowSize` 决定了屏幕外渲染的范围。默认值是 21（向上 10 屏，向下 10 屏）。

- **优化建议**：对于普通列表，建议将其设置为 `5` 或 `7`，以减少内存占用和首屏渲染压力。

### 2.3 保持 Item 组件简洁并使用 `React.memo`

确保你的渲染组件是纯粹的，并使用 `memo` 包裹：

```tsx
const ListItem = React.memo(
  ({item}) => {
    return <View>...</View>;
  },
  (prevProps, nextProps) => prevProps.item.id === nextProps.item.id,
);
```

### 2.4 正确使用 `keyExtractor`

**不要使用 index 作为 key**。稳定的 key 能帮助 React 更高效地重用已有的 DOM/视图节点。

## 3. 其他进阶参数

| 参数                        | 建议值       | 说明                                                |
| :-------------------------- | :----------- | :-------------------------------------------------- |
| `initialNumToRender`        | 刚好铺满首屏 | 减少首屏加载时间。                                  |
| `maxToRenderPerBatch`       | 10           | 每次增量渲染的数量。设置过大会阻塞主线程。          |
| `removeClippedSubviews`     | true         | 剪裁掉屏幕外的子视图。在 Android 和鸿蒙上效果明显。 |
| `updateCellsBatchingPeriod` | 50           | 渲染批次之间的时间间隔（毫秒）。                    |

## 4. 为什么我们依然使用 FlatList 而不是 FlashList？

1. **鸿蒙（RNOH）适配性**：目前在鸿蒙版 React Native 环境下，官方 `FlatList` 的桥接适配最稳定。
2. **迁移成本**：`FlatList` 是官方标准，生态支持（如各种下拉刷新组件）最完善。
3. **性能达标**：通过上述 `getItemLayout` 等参数优化后，`FlatList` 足以应对本项目的大部分业务逻辑。

## 5. 调试建议

- **使用 Reactotron**：观察每次滑动时是否触发了大量的状态更新。
- **开启真机性能监控**：在鸿蒙真机上观察滑动时的 FPS 波动。
- **检查白块**：如果滑动时频繁出现白块，说明 `windowSize` 可能设小了，或者 JS 线程太忙（检查是否有死循环或高频计算）。

---

_更多关于 Hooks 的结合使用，请参考 [usePaginatedList 指南](../hook/usePaginatedList.md)_
