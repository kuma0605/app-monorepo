/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-void */

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import {Button, Icon, Portal} from '@ant-design/react-native';
import type {
  CellMenuItem,
  ClickMenuItem,
  DaDropdownProps,
  DaterangeMenuItem,
  DaterangeValue,
  DropdownMenuItem,
  DropdownOption,
  FilterMenuItem,
  PickerMenuItem,
  SearchMenuItem,
  SlotActiveOptions,
  SlotMenuItem,
  SlotRenderParams,
  SortMenuItem,
} from './types';
import {alignData, deepClone} from './utils';
import {isSlotMenuType, isSlotMenuValueActive} from './slotMenuUtils';
import {shouldRefreshAfterDropdownConfirm} from './confirmOptions';
import {DropdownCell} from './DropdownCell';
import {DropdownFilter} from './DropdownFilter';
import {DropdownPicker} from './DropdownPicker';
import {DropdownDaterange} from './DropdownDaterange';

const ALL_ITEM: DropdownOption = {label: '不限', value: '-9999'};

const defaultProps = {
  menuActiveText: true,
  themeColor: '#007aff',
  textColor: '#ffffff',
  bgColor: '#171933',
  fixedTop: false,
  fixedTopValue: 0,
  duration: 300,
  menuHeight: 50,
} as const;

async function initMenuList(
  dropdownMenuData: DropdownMenuItem[] | undefined,
): Promise<DropdownMenuItem[]> {
  const newMenu = deepClone(dropdownMenuData ?? []);
  const hasShowAllType = new Set<DropdownMenuItem['type']>(['cell', 'picker']);

  for (let i = 0; i < newMenu.length; i++) {
    const item = newMenu[i];

    if (
      hasShowAllType.has(item.type) &&
      'syncDataFn' in item &&
      item.syncDataFn
    ) {
      const syncFn = item.syncDataFn;
      const syncOptions = await Promise.resolve(syncFn());
      if (item.type === 'cell' || item.type === 'picker') {
        item.options = syncOptions ?? [];
      }
    }

    if (
      (item.type === 'cell' || item.type === 'picker') &&
      item.options?.length
    ) {
      if ('field' in item && item.field) {
        item.options = alignData(item.options, item.field);
      }
      if (item.showAll === true) {
        const exists = item.options.some(
          k => String(k.value) === String(ALL_ITEM.value),
        );
        if (!exists) {
          item.options = [ALL_ITEM, ...item.options];
        }
      }
    }

    const hasValue =
      'value' in item &&
      item.value !== undefined &&
      item.value !== null &&
      item.value !== '';

    if (hasValue || ('value' in item && item.value === false)) {
      if (item.type === 'cell') {
        const cell = item as CellMenuItem;
        for (let x = 0; x < (cell.options?.length ?? 0); x++) {
          const k = cell.options[x];
          if (k.value === cell.value) {
            cell.isActived = true;
            cell.activeTitle = k.label;
            break;
          }
        }
      }
      if (item.type === 'click') {
        const click = item as ClickMenuItem;
        click.isActived = click.value === true;
      }
      if (item.type === 'sort') {
        const sort = item as SortMenuItem;
        sort.isActived = sort.value === 'asc' || sort.value === 'desc';
      }
      if (item.type === 'filter') {
        const filter = item as FilterMenuItem;
        filter.isActived = JSON.stringify(filter.value ?? {}) !== '{}';
      }
      if (item.type === 'picker') {
        const picker = item as PickerMenuItem;
        picker.isActived =
          Array.isArray(picker.value) && picker.value.length > 0;
      }
      if (item.type === 'daterange') {
        const dr = item as DaterangeMenuItem;
        dr.isActived = !!(dr.value?.start && dr.value?.end);
      }
    } else {
      item.isActived = false;
      if (item.type === 'cell') {
        (item as CellMenuItem).activeTitle = null;
      }
    }

    if (item.type === 'search') {
      item.isHidden = 'true';
    }

    if (isSlotMenuType(item.type)) {
      const slot = item as SlotMenuItem;
      slot.isActived = isSlotMenuValueActive(slot.value);
      if (!slot.isActived) {
        slot.activeTitle = null;
      }
    }
  }

  return newMenu;
}

export const DaDropdown = memo(function DaDropdown(props: DaDropdownProps) {
  const {
    dropdownMenu,
    menuActiveText = defaultProps.menuActiveText,
    themeColor = defaultProps.themeColor,
    textColor = defaultProps.textColor,
    bgColor = defaultProps.bgColor,
    fixedTop = defaultProps.fixedTop,
    fixedTopValue = defaultProps.fixedTopValue,
    duration: _duration = defaultProps.duration,
    menuHeight = defaultProps.menuHeight,
    onOpen,
    onClose,
    onConfirm,
    onRefresh,
    onDropdownMenuChange,
    renderSlot1,
    renderSlot2,
    renderSlot3,
    renderSlot4,
    renderSlot5,
  } = props;

  void _duration;
  const fixedOffset = fixedTopValue || 0;

  const [menuList, setMenuList] = useState<DropdownMenuItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);

  const currentIndexRef = useRef(-1);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const isVisibleRef = useRef(false);
  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  const popupMaxHeight = useMemo(
    () => Math.min(Dimensions.get('window').height * 0.65, 520),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void initMenuList(dropdownMenu).then(m => {
      if (!cancelled) {
        setMenuList(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dropdownMenu]);

  const hasSearch = useMemo(
    () => menuList.some(x => x.type === 'search'),
    [menuList],
  );

  const searchItem = useMemo(
    () => menuList.find((x): x is SearchMenuItem => x.type === 'search'),
    [menuList],
  );

  const rootRef = useRef<View>(null);
  const dropdownBarRef = useRef<View>(null);
  /** 蒙层与弹层相对 root 的 top，以及蒙层高度（铺满到屏幕底），windowTop 用于 Modal 绝对定位 */
  const [overlayMetrics, setOverlayMetrics] = useState({
    top: 0,
    maskHeight: 0,
    windowTop: 0,
  });

  const syncOverlayLayout = useCallback(() => {
    const winH = Dimensions.get('window').height;
    const root = rootRef.current;
    const bar = dropdownBarRef.current;
    if (!root || !bar) {
      return;
    }
    root.measure((_rx, _ry, _rw, _rh, rPageX, rPageY) => {
      bar.measure((_bx, _by, _bw, bh, bPageX, bPageY) => {
        const barBottomWin = bPageY + bh;
        const topRel = Math.max(0, barBottomWin - rPageY);
        const maskHeight = Math.max(0, winH - barBottomWin);
        setOverlayMetrics({top: topRel, maskHeight, windowTop: barBottomWin});
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }
    syncOverlayLayout();
  }, [isVisible, hasSearch, menuHeight, fixedTop, fixedOffset, syncOverlayLayout]);

  useEffect(() => {
    const handler = () => {
      if (isVisibleRef.current) {
        syncOverlayLayout();
      }
    };
    const sub = Dimensions.addEventListener?.('change', handler);
    return () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    };
  }, [syncOverlayLayout]);

  const barChromeStyle = useMemo(() => {
    if (!fixedTop) {
      return undefined;
    }
    return {
      height: fixedOffset + (hasSearch ? menuHeight * 2 : menuHeight),
    };
  }, [fixedTop, fixedOffset, hasSearch, menuHeight]);

  const commitMenu = useCallback(
    (next: DropdownMenuItem[]) => {
      setMenuList(next);
      onDropdownMenuChange?.(deepClone(next));
    },
    [onDropdownMenuChange],
  );

  const dispatchConfirm = useCallback(
    (
      payload: Record<string, unknown>,
      options?: Parameters<NonNullable<DaDropdownProps['onConfirm']>>[1],
    ) => {
      onConfirm?.(payload, options);
      if (onRefresh && shouldRefreshAfterDropdownConfirm(options)) {
        onRefresh();
      }
    },
    [onConfirm, onRefresh],
  );

  const clearIndex = useCallback(() => {
    setCurrentIndex(-1);
  }, []);

  const finishClose = useCallback(
    (idx: number) => {
      setIsVisible(false);
      clearIndex();
      onClose?.(idx);
    },
    [clearIndex, onClose],
  );

  const handlePopupHide = useCallback(() => {
    if (!isVisibleRef.current) {
      return;
    }
    const closingIndex = currentIndexRef.current;
    finishClose(closingIndex);
  }, [finishClose]);

  const handlePopupShow = useCallback(
    (index: number) => {
      setIsVisible(true);
      setCurrentIndex(index);
      onOpen?.(index);
      requestAnimationFrame(() => {
        syncOverlayLayout();
      });
    },
    [onOpen, syncOverlayLayout],
  );

  const handlePopupMask = useCallback(() => {
    setMenuList(prev => prev.map(k => ({...k, isClick: false})));
    handlePopupHide();
  }, [handlePopupHide]);

  const handleMenuClick = useCallback(
    (index: number, item: DropdownMenuItem) => {
      if (item.type === 'click') {
        if (isVisibleRef.current) {
          handlePopupHide();
        }
        const draft = deepClone(menuList).map(k => ({...k, isClick: false}));
        const clickItem = draft[index] as ClickMenuItem;
        if (clickItem.isActived === true) {
          clickItem.value = false;
          clickItem.isActived = false;
        } else {
          draft.forEach(k => {
            if (k.type === 'click') {
              const c = k as ClickMenuItem;
              c.value = false;
              c.isActived = false;
            }
          });
          clickItem.value = true;
          clickItem.isActived = true;
        }
        if (clickItem.prop) {
          dispatchConfirm({[clickItem.prop]: clickItem.value});
          commitMenu(draft);
        } else {
          console.error(`菜单项${clickItem.title}未定义prop，返回内容失败`);
        }
        return;
      }

      if (item.type === 'sort') {
        if (isVisibleRef.current) {
          handlePopupHide();
        }
        const draft = deepClone(menuList).map(k => ({...k, isClick: false}));
        const sortItem = draft[index] as SortMenuItem;
        if (sortItem.value === 'asc') {
          sortItem.value = 'desc';
          sortItem.isActived = true;
        } else if (sortItem.value === 'desc') {
          sortItem.value = undefined;
          sortItem.isActived = false;
        } else {
          sortItem.value = 'asc';
          sortItem.isActived = true;
        }
        if (sortItem.prop) {
          dispatchConfirm({[sortItem.prop]: sortItem.value});
          commitMenu(draft);
        } else {
          console.error(`菜单项${sortItem.title}未定义prop，返回内容失败`);
        }
        return;
      }

      if (index === currentIndexRef.current) {
        const draft = deepClone(menuList).map((k, i) =>
          i === index ? {...k, isClick: false} : {...k, isClick: false},
        );
        setMenuList(draft);
        handlePopupHide();
        return;
      }

      const draft = deepClone(menuList).map((k, i) => ({
        ...k,
        isClick: i === index,
      }));
      setMenuList(draft);
      handlePopupShow(index);
    },
    [commitMenu, dispatchConfirm, handlePopupHide, handlePopupShow, menuList],
  );

  const handleSearchChange = useCallback((text: string) => {
    setMenuList(prev =>
      prev.map(row => (row.type === 'search' ? {...row, value: text} : row)),
    );
  }, []);

  const handleSearch = useCallback(() => {
    const si = menuList.find((x): x is SearchMenuItem => x.type === 'search');
    if (si?.prop) {
      const res = {[si.prop]: si.value};
      onDropdownMenuChange?.(deepClone(menuList));
      dispatchConfirm(res);
    } else if (si) {
      console.error(`菜单项${si.title}未定义prop，返回内容失败`);
    }
  }, [menuList, dispatchConfirm, onDropdownMenuChange]);

  const handleCellSelect = useCallback(
    (
      callbackData: Record<string, unknown>,
      cellItem: DropdownOption,
      index: number,
    ) => {
      const draft = deepClone(menuList);
      const cell = draft[index] as CellMenuItem;
      cell.isClick = false;
      if (String(cellItem.value) === String(ALL_ITEM.value)) {
        cell.isActived = false;
        cell.activeTitle = undefined;
        cell.value = null;
      } else {
        cell.isActived = true;
        cell.activeTitle = cellItem.label;
        cell.value = cellItem.value;
      }
      commitMenu(draft);
      dispatchConfirm(callbackData);
      handlePopupHide();
    },
    [commitMenu, dispatchConfirm, handlePopupHide, menuList],
  );

  const handleFilterConfirm = useCallback(
    (
      callbackData: Record<string, unknown>,
      filterData: Record<string, unknown>,
      index: number,
    ) => {
      const draft = deepClone(menuList);
      const filterItem = draft[index] as FilterMenuItem;
      filterItem.isClick = false;
      filterItem.isActived = JSON.stringify(filterData ?? {}) !== '{}';
      filterItem.activeTitle = undefined;
      filterItem.value = filterData;
      commitMenu(draft);
      dispatchConfirm(callbackData, {action: 'confirm'});
      handlePopupHide();
    },
    [commitMenu, dispatchConfirm, handlePopupHide, menuList],
  );

  const handleFilterReset = useCallback(
    (
      callbackData: Record<string, unknown>,
      _filterData: Record<string, unknown>,
      index: number,
    ) => {
      const draft = deepClone(menuList);
      const filterItem = draft[index] as FilterMenuItem;
      const shouldClose = filterItem.resetRefresh === true;
      if (shouldClose) {
        filterItem.isClick = false;
      }
      filterItem.isActived = false;
      filterItem.activeTitle = undefined;
      filterItem.value = {};
      commitMenu(draft);
      dispatchConfirm(callbackData, {
        action: 'reset',
        refresh: shouldClose,
      });
      if (shouldClose) {
        handlePopupHide();
      }
    },
    [commitMenu, dispatchConfirm, handlePopupHide, menuList],
  );

  const handlePickerConfirm = useCallback(
    (
      callbackData: Record<string, unknown>,
      pickerItem: Array<string | number> | null,
      index: number,
    ) => {
      const draft = deepClone(menuList);
      const picker = draft[index] as PickerMenuItem;
      picker.isClick = false;
      if (
        !pickerItem ||
        pickerItem.length === 0 ||
        String(pickerItem[0]) === String(ALL_ITEM.value)
      ) {
        picker.isActived = false;
        picker.activeTitle = undefined;
        picker.value = null;
      } else {
        picker.isActived = true;
        picker.value = pickerItem;
      }
      commitMenu(draft);
      dispatchConfirm(callbackData, {action: 'confirm'});
      handlePopupHide();
    },
    [commitMenu, dispatchConfirm, handlePopupHide, menuList],
  );

  const handlePickerReset = useCallback(
    (
      callbackData: Record<string, unknown>,
      _pickerItem: Array<string | number> | null,
      index: number,
    ) => {
      const draft = deepClone(menuList);
      const picker = draft[index] as PickerMenuItem;
      const shouldClose = picker.resetRefresh === true;
      if (shouldClose) {
        picker.isClick = false;
      }
      picker.isActived = false;
      picker.activeTitle = undefined;
      picker.value = null;
      commitMenu(draft);
      dispatchConfirm(callbackData, {
        action: 'reset',
        refresh: shouldClose,
      });
      if (shouldClose) {
        handlePopupHide();
      }
    },
    [commitMenu, dispatchConfirm, handlePopupHide, menuList],
  );

  const handleDaterangeConfirm = useCallback(
    (
      callbackData: Record<string, unknown>,
      range: DaterangeValue | null,
      index: number,
    ) => {
      const draft = deepClone(menuList);
      const dr = draft[index] as DaterangeMenuItem;
      dr.isClick = false;
      if (range?.start && range?.end) {
        dr.isActived = true;
        dr.value = range;
      } else {
        dr.isActived = false;
        dr.activeTitle = undefined;
        dr.value = null;
      }
      commitMenu(draft);
      dispatchConfirm(callbackData, {action: 'confirm'});
      handlePopupHide();
    },
    [commitMenu, dispatchConfirm, handlePopupHide, menuList],
  );

  const handleDaterangeReset = useCallback(
    (
      callbackData: Record<string, unknown>,
      _range: DaterangeValue | null,
      index: number,
    ) => {
      const draft = deepClone(menuList);
      const dr = draft[index] as DaterangeMenuItem;
      const shouldClose = dr.resetRefresh === true;
      if (shouldClose) {
        dr.isClick = false;
      }
      dr.isActived = false;
      dr.activeTitle = undefined;
      dr.value = null;
      commitMenu(draft);
      dispatchConfirm(callbackData, {
        action: 'reset',
        refresh: shouldClose,
      });
      if (shouldClose) {
        handlePopupHide();
      }
    },
    [commitMenu, dispatchConfirm, handlePopupHide, menuList],
  );

  const menuLabel = useCallback(
    (row: DropdownMenuItem) => {
      if (!menuActiveText) {
        return row.title;
      }
      if (row.activeTitle) {
        if (row.type === 'cell' || isSlotMenuType(row.type)) {
          return row.activeTitle;
        }
      }
      return row.title;
    },
    [menuActiveText],
  );

  const patchSlotActive = useCallback(
    (index: number, active: boolean, options?: SlotActiveOptions) => {
      const draft = deepClone(menuList);
      const row = draft[index];
      if (!row || !isSlotMenuType(row.type)) {
        return;
      }
      const slot = row as SlotMenuItem;
      if (options?.value !== undefined) {
        slot.value = options.value;
      }
      slot.isActived = active;
      if (options?.activeTitle !== undefined) {
        slot.activeTitle = options.activeTitle;
      } else if (!active) {
        slot.activeTitle = null;
      }
      commitMenu(draft);
    },
    [commitMenu, menuList],
  );

  const renderSlot = useCallback(
    (slotItem: SlotMenuItem, index: number) => {
      const map: Record<
        SlotMenuItem['type'],
        DaDropdownProps['renderSlot1'] | undefined
      > = {
        slot1: renderSlot1,
        slot2: renderSlot2,
        slot3: renderSlot3,
        slot4: renderSlot4,
        slot5: renderSlot5,
      };
      const fn = map[slotItem.type];
      const params: SlotRenderParams = {
        item: slotItem,
        index,
        close: handlePopupMask,
        setActive: (active, options) => patchSlotActive(index, active, options),
      };
      return fn ? fn(params) : null;
    },
    [
      handlePopupMask,
      patchSlotActive,
      renderSlot1,
      renderSlot2,
      renderSlot3,
      renderSlot4,
      renderSlot5,
    ],
  );

  const activeItem = currentIndex >= 0 ? menuList[currentIndex] : undefined;

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        bar: {backgroundColor: bgColor},
        activeText: {color: themeColor},
      }),
    [bgColor, themeColor],
  );

  return (
    <View ref={rootRef} collapsable={false} style={styles.root}>
      {isVisible ? (
        <Portal>
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {/* 顶部的透明点击区域，用于关闭下拉框 */}
            <TouchableOpacity
              activeOpacity={1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: overlayMetrics.windowTop,
              }}
              onPress={handlePopupMask}
            />
            {/* 实际的半透明蒙层 */}
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.overlayMaskHit,
                {
                  top: overlayMetrics.windowTop,
                  height: overlayMetrics.maskHeight,
                },
              ]}
              onPress={handlePopupMask}>
              <View pointerEvents="none" style={styles.overlayMaskFill} />
            </TouchableOpacity>
            {/* 下拉面板内容 */}
            <View
              style={[
                styles.overlayPopup,
                {
                  top: overlayMetrics.windowTop,
                  maxHeight: popupMaxHeight,
                  backgroundColor: '#ffffff',
                },
              ]}>
              {/*
              切换不同头部项时复用同一类子组件（如两个 filter）会导致内部 ScrollView
              等保留上一项的滚动位置；按 currentIndex 设 key 强制重挂载以重置滚动。
            */}
              <View
                key={`dd-panel-${currentIndex}`}
                style={styles.overlayPanelInner}>
                {activeItem?.type === 'cell' && currentIndex >= 0 ? (
                  <DropdownCell
                    dropdownItem={activeItem as CellMenuItem}
                    dropdownIndex={currentIndex}
                    themeColor={themeColor}
                    textColor={textColor}
                    onSuccess={handleCellSelect}
                  />
                ) : null}

                {activeItem?.type === 'filter' && currentIndex >= 0 ? (
                  <DropdownFilter
                    dropdownItem={activeItem as FilterMenuItem}
                    dropdownIndex={currentIndex}
                    themeColor={themeColor}
                    textColor={textColor}
                    onSuccess={handleFilterConfirm}
                    onReset={handleFilterReset}
                  />
                ) : null}

                {activeItem?.type === 'picker' && currentIndex >= 0 ? (
                  <DropdownPicker
                    dropdownItem={activeItem as PickerMenuItem}
                    dropdownIndex={currentIndex}
                    themeColor={themeColor}
                    textColor={textColor}
                    onSuccess={handlePickerConfirm}
                    onReset={handlePickerReset}
                  />
                ) : null}

                {activeItem?.type === 'daterange' && currentIndex >= 0 ? (
                  <DropdownDaterange
                    dropdownItem={activeItem as DaterangeMenuItem}
                    dropdownIndex={currentIndex}
                    themeColor={themeColor}
                    textColor={'#666666'}
                    onSuccess={handleDaterangeConfirm}
                    onReset={handleDaterangeReset}
                  />
                ) : null}

                {activeItem?.type === 'slot1' && currentIndex >= 0
                  ? renderSlot(activeItem as SlotMenuItem, currentIndex)
                  : null}
                {activeItem?.type === 'slot2' && currentIndex >= 0
                  ? renderSlot(activeItem as SlotMenuItem, currentIndex)
                  : null}
                {activeItem?.type === 'slot3' && currentIndex >= 0
                  ? renderSlot(activeItem as SlotMenuItem, currentIndex)
                  : null}
                {activeItem?.type === 'slot4' && currentIndex >= 0
                  ? renderSlot(activeItem as SlotMenuItem, currentIndex)
                  : null}
                {activeItem?.type === 'slot5' && currentIndex >= 0
                  ? renderSlot(activeItem as SlotMenuItem, currentIndex)
                  : null}
              </View>
            </View>
          </View>
        </Portal>
      ) : null}

      <View
        ref={dropdownBarRef}
        collapsable={false}
        style={[styles.chromeLayer, barChromeStyle]}>
        {hasSearch && searchItem ? (
          <View
            style={[
              styles.searchRow,
              dynamicStyles.bar,
              fixedTop ? {...styles.searchFixed, top: fixedOffset} : null,
            ]}>
            <TextInput
              style={styles.searchInput}
              value={searchItem.value ?? ''}
              placeholder={searchItem.placeholder ?? '请输入'}
              placeholderTextColor="#999999"
              returnKeyType="search"
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearch}
            />
            <Button type="primary" size="small" onPress={handleSearch}>
              搜索
            </Button>
          </View>
        ) : null}

        <View
          style={[
            styles.menuRow,
            {height: menuHeight},
            dynamicStyles.bar,
            fixedTop
              ? {
                  ...styles.menuFixed,
                  top: hasSearch ? fixedOffset + menuHeight : fixedOffset,
                }
              : null,
          ]}>
          {menuList.map((item, index) => {
            const hidden = item.isHidden === 'true' || item.isHidden === true;
            if (hidden) {
              return null;
            }
            const active = item.isActived === true;
            return (
              <TouchableOpacity
                key={`${item.title}-${index}`}
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={() => handleMenuClick(index, item)}>
                <Text
                  style={[
                    styles.menuText,
                    {color: textColor},
                    active ? dynamicStyles.activeText : null,
                  ]}
                  numberOfLines={1}>
                  {menuLabel(item)}
                </Text>
                {item.type !== 'click' && item.type !== 'sort' ? (
                  <Icon
                    name={item.isClick ? 'caret-up' : 'caret-down'}
                    size={10}
                    color={textColor}
                    style={styles.arrow}
                  />
                ) : null}
                {item.type === 'sort' ? (
                  <View style={styles.sortWrap}>
                    <View
                      style={[
                        styles.sortTriUp,
                        item.value === 'asc'
                          ? {borderBottomColor: themeColor}
                          : null,
                      ]}
                    />
                    <View
                      style={[
                        styles.sortTriDown,
                        item.value === 'desc'
                          ? {borderTopColor: themeColor}
                          : null,
                      ]}
                    />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {fixedTop ? (
        <View
          style={[
            styles.blank,
            {
              height: fixedOffset + (hasSearch ? menuHeight * 2 : menuHeight),
            },
          ]}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    zIndex: 888,
    width: '100%',
    overflow: 'visible',
  },
  chromeLayer: {
    position: 'relative',
    zIndex: 20,
    elevation: 20,
  },
  overlayMaskHit: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  overlayMaskFill: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  overlayPopup: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 11,
    elevation: 11,
    width: '100%',
    overflow: 'hidden',
  },
  overlayPanelInner: {
    width: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    columnGap: 8,
  },
  searchFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    color: '#333333',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  menuFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
  },
  menuItem: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  menuText: {
    fontSize: 15,
    maxWidth: '78%',
  },
  arrow: {
    marginLeft: 4,
    fontSize: 10,
  },
  sortWrap: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortTriUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#bbbbbb',
    marginBottom: 2,
  },
  sortTriDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#bbbbbb',
  },
  blank: {
    width: '100%',
  },
});
