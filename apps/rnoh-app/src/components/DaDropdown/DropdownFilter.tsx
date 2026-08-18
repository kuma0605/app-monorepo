import {memo, useCallback, useMemo, useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import {Checkbox} from '@ant-design/react-native';
import type {
  FilterMenuItem,
  FilterSubItem,
  FilterSubItemCheckbox,
  FilterSubItemRadio,
} from './types';
import {deepClone} from './utils';
import {PartDropdownFooter} from './PartDropdownFooter';

export interface DropdownFilterProps {
  dropdownItem: FilterMenuItem;
  dropdownIndex: number;
  themeColor: string;
  textColor: string;
  onSuccess: (
    payload: Record<string, unknown>,
    filterValue: Record<string, unknown>,
    index: number,
  ) => void;
  onReset: (
    payload: Record<string, unknown>,
    filterValue: Record<string, unknown>,
    index: number,
  ) => void;
}

function initData(
  dropdownItem: FilterMenuItem,
  clearValue: boolean,
): FilterSubItem[] {
  const {options = [], value = {}} = dropdownItem;
  if (!options.length) {
    return [];
  }
  const list = deepClone(options) as FilterSubItem[];
  for (let i = 0; i < list.length; i++) {
    const k = list[i];
    if (!clearValue && Object.prototype.hasOwnProperty.call(value, k.prop)) {
      k.value = value[k.prop] as never;
    } else if (clearValue) {
      if (k.type === 'checkbox') {
        k.value = [];
        k.options?.forEach(x => {
          x.isActived = false;
        });
      } else {
        k.value = null;
      }
    }
    if (
      k.type === 'checkbox' &&
      Array.isArray(k.value) &&
      k.value.length &&
      k.options?.length
    ) {
      k.options.forEach(x => {
        x.isActived = k.value?.includes(x.value) ?? false;
      });
    }
  }
  return list;
}

export const DropdownFilter = memo(function DropdownFilter({
  dropdownItem,
  dropdownIndex,
  themeColor,
  onSuccess,
  onReset,
}: DropdownFilterProps) {
  const [filterList, setFilterList] = useState<FilterSubItem[]>(() =>
    initData(dropdownItem, false),
  );

  useEffect(() => {
    setFilterList(initData(dropdownItem, false));
  }, [dropdownItem]);

  const handleRadioChange = useCallback(
    (item: FilterSubItemRadio, optValue: string | number) => {
      setFilterList(prev =>
        prev.map(row =>
          row.prop === item.prop && row.type === 'radio'
            ? {...row, value: optValue}
            : row,
        ),
      );
    },
    [],
  );

  const handleCheckboxChange = useCallback(
    (
      item: FilterSubItemCheckbox,
      optValue: string | number,
      checked: boolean,
    ) => {
      setFilterList(prev =>
        prev.map(row => {
          if (row.prop !== item.prop || row.type !== 'checkbox') {
            return row;
          }
          const next = deepClone(row) as FilterSubItemCheckbox;
          const cur = Array.isArray(next.value) ? [...next.value] : [];
          if (checked) {
            if (!cur.includes(optValue)) {
              cur.push(optValue);
            }
          } else {
            const idx = cur.indexOf(optValue);
            if (idx >= 0) {
              cur.splice(idx, 1);
            }
          }
          next.value = cur;
          next.options?.forEach(o => {
            if (o.value === optValue) {
              o.isActived = checked;
            }
          });
          return next;
        }),
      );
    },
    [],
  );

  const handleReset = useCallback(() => {
    setFilterList(initData(dropdownItem, true));
    if (dropdownItem.prop) {
      onReset({[dropdownItem.prop]: {}}, {}, dropdownIndex);
    }
  }, [dropdownItem, dropdownIndex, onReset]);

  const handleConfirm = useCallback(() => {
    if (!dropdownItem.prop) {
      return;
    }
    const list = deepClone(filterList);
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < list.length; i++) {
      const k = list[i];
      if (k.value !== undefined && k.value !== null && k.value !== '') {
        if (
          k.type === 'checkbox' &&
          Array.isArray(k.value) &&
          k.value.length === 0
        ) {
          continue;
        }
        obj[k.prop] = k.value;
      }
    }
    const res: Record<string, unknown> = {[dropdownItem.prop]: obj};
    onSuccess(res, obj, dropdownIndex);
  }, [dropdownIndex, dropdownItem.prop, filterList, onSuccess]);

  const radioOuter = useMemo(
    () =>
      StyleSheet.create({
        ring: {borderColor: themeColor},
        dot: {backgroundColor: themeColor},
      }),
    [themeColor],
  );

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {filterList.map((item, index) => (
          <View key={`${item.prop}-${index}`} style={styles.box}>
            {item.type === 'radio' ? (
              <View>
                {item.options.map(opt => {
                  const selected = item.value === opt.value;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={styles.radioRow}
                      activeOpacity={0.85}
                      onPress={() => handleRadioChange(item, opt.value)}>
                      <Text style={styles.optText}>{opt.label}</Text>
                      <View
                        style={[
                          styles.radioRing,
                          selected ? radioOuter.ring : styles.radioRingIdle,
                        ]}>
                        {selected ? (
                          <View style={[styles.radioDot, radioOuter.dot]} />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
            {item.type === 'checkbox' ? (
              <View>
                {item.options.map(opt => (
                  <View key={String(opt.value)} style={styles.cbRow}>
                    <Checkbox
                      checked={opt.isActived === true}
                      onChange={e =>
                        handleCheckboxChange(
                          item,
                          opt.value,
                          e.target.checked === true,
                        )
                      }>
                      <Text style={styles.optText}>{opt.label}</Text>
                    </Checkbox>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <PartDropdownFooter
        resetText={dropdownItem.resetText}
        confirmText={dropdownItem.confirmText}
        themeColor={themeColor}
        onReset={handleReset}
        onConfirm={handleConfirm}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {width: '100%'},
  scroll: {maxHeight: 300},
  box: {
    paddingHorizontal: 24,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
  },
  radioRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingIdle: {
    borderColor: '#cccccc',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cbRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
  },
  optText: {
    fontSize: 16,
    color: '#333333',
  },
});
