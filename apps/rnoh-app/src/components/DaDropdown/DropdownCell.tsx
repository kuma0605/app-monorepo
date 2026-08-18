import {memo, useCallback, useMemo} from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import type {CellMenuItem, DropdownOption} from './types';
import {deepClone} from './utils';

export interface DropdownCellProps {
  dropdownItem: CellMenuItem;
  dropdownIndex: number;
  themeColor: string;
  textColor: string;
  onSuccess: (
    payload: Record<string, unknown>,
    cell: DropdownOption,
    index: number,
  ) => void;
}

function initOptions(
  options: DropdownOption[],
  value: string | number | null | undefined,
) {
  const list = deepClone(options);
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    if (row.value === value) {
      row.checked = true;
      break;
    }
  }
  return list;
}

export const DropdownCell = memo(function DropdownCell({
  dropdownItem,
  dropdownIndex,
  themeColor,
  textColor,
  onSuccess,
}: DropdownCellProps) {
  const rows = useMemo(() => {
    if (!dropdownItem.options?.length) {
      return [] as DropdownOption[];
    }
    return initOptions(dropdownItem.options, dropdownItem.value ?? null);
  }, [dropdownItem.options, dropdownItem.value]);

  const showIcon = dropdownItem.showIcon === true;

  const dynamic = useMemo(
    () =>
      StyleSheet.create({
        active: {color: themeColor},
        checkAfter: {color: themeColor},
      }),
    [themeColor],
  );

  const handleSelect = useCallback(
    (item: DropdownOption) => {
      if (item.disabled) {
        return;
      }
      if (!dropdownItem.prop) {
        console.error(`菜单项${dropdownItem.title}未定义prop，返回内容失败`);
        return;
      }
      const res: Record<string, unknown> = {
        [dropdownItem.prop]: item.value,
      };
      onSuccess(res, item, dropdownIndex);
    },
    [dropdownIndex, dropdownItem.prop, dropdownItem.title, onSuccess],
  );

  const renderItem: ListRenderItem<DropdownOption> = useCallback(
    ({item}) => {
      const active = item.checked === true;
      return (
        <TouchableOpacity
          style={[styles.item, item.disabled ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={() => handleSelect(item)}>
          <Text
            style={[
              styles.label,
              {color: textColor},
              active ? dynamic.active : null,
            ]}
            numberOfLines={1}>
            {item.label}
          </Text>
          {item.suffix ? (
            <Text style={styles.suffix} numberOfLines={1}>
              {item.suffix}
            </Text>
          ) : (
            <View style={styles.suffixSpacer} />
          )}
          {active && showIcon ? (
            <Text style={[styles.check, dynamic.checkAfter]}>✓</Text>
          ) : null}
        </TouchableOpacity>
      );
    },
    [dynamic.active, dynamic.checkAfter, handleSelect, showIcon, textColor],
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        style={styles.list}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxHeight: 360,
  },
  list: {width: '100%'},
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dedede',
  },
  disabled: {
    backgroundColor: '#efefef',
  },
  label: {
    flex: 1,
    maxWidth: '80%',
    fontSize: 16,
  },
  suffix: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#999999',
    textAlign: 'right',
  },
  suffixSpacer: {flex: 1},
  check: {
    width: 40,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});
