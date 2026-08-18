import {memo, useCallback, useMemo, useState, useEffect} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import type {DropdownOption, PickerMenuItem} from './types';
import {deepClone} from './utils';
import {PartDropdownFooter} from './PartDropdownFooter';

const UNLIMITED_VALUE = '-9999';

export interface DropdownPickerProps {
  dropdownItem: PickerMenuItem;
  dropdownIndex: number;
  themeColor: string;
  textColor: string;
  onSuccess: (
    payload: Record<string, unknown>,
    path: Array<string | number> | null,
    index: number,
  ) => void;
  onReset: (
    payload: Record<string, unknown>,
    path: Array<string | number> | null,
    index: number,
  ) => void;
}

function withUnlimitedRoot(options: DropdownOption[]): DropdownOption[] {
  const all: DropdownOption = {label: '不限', value: UNLIMITED_VALUE};
  if (options.some(o => String(o.value) === UNLIMITED_VALUE)) {
    return options;
  }
  return [all, ...options];
}

export const DropdownPicker = memo(function DropdownPicker({
  dropdownItem,
  dropdownIndex,
  themeColor,
  textColor,
  onSuccess,
  onReset,
}: DropdownPickerProps) {
  const baseOptions = useMemo(() => {
    const opts = dropdownItem.options ?? [];
    const cloned = deepClone(opts);
    return dropdownItem.showAll === true ? withUnlimitedRoot(cloned) : cloned;
  }, [dropdownItem.options, dropdownItem.showAll]);

  const [path, setPath] = useState<Array<string | number>>([]);

  useEffect(() => {
    const v = dropdownItem.value;
    if (Array.isArray(v) && v.length) {
      setPath([...v]);
    } else {
      setPath([]);
    }
  }, [dropdownItem.value]);

  const columns = useMemo(() => {
    const levels: DropdownOption[][] = [];
    let cur = baseOptions;
    levels.push(cur);
    for (let i = 0; i < path.length; i++) {
      const pick = path[i];
      const node = cur.find(c => c.value === pick);
      if (node?.children?.length) {
        cur = node.children;
        levels.push(cur);
      } else {
        break;
      }
    }
    return levels;
  }, [baseOptions, path]);

  const handlePick = useCallback((level: number, opt: DropdownOption) => {
    setPath(prev => {
      const next = prev.slice(0, level);
      next[level] = opt.value;
      if (String(opt.value) === UNLIMITED_VALUE) {
        return [opt.value];
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setPath([]);
    if (dropdownItem.prop) {
      onReset({[dropdownItem.prop]: null}, null, dropdownIndex);
    }
  }, [dropdownIndex, dropdownItem.prop, onReset]);

  const handleConfirm = useCallback(() => {
    if (!dropdownItem.prop) {
      console.error(`菜单项${dropdownItem.title}未定义prop，返回内容失败`);
      return;
    }
    const first = path[0];
    if (
      !path.length ||
      first === UNLIMITED_VALUE ||
      String(first) === UNLIMITED_VALUE
    ) {
      const res: Record<string, unknown> = {[dropdownItem.prop]: null};
      onSuccess(res, null, dropdownIndex);
      return;
    }
    const res: Record<string, unknown> = {[dropdownItem.prop]: [...path]};
    onSuccess(res, [...path], dropdownIndex);
  }, [dropdownIndex, dropdownItem.prop, dropdownItem.title, onSuccess, path]);

  const activeStyle = useMemo(
    () => StyleSheet.create({txt: {color: themeColor}}),
    [themeColor],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScroll}>
        {columns.map((opts, level) => (
          <ScrollView
            key={`col-${level}`}
            style={styles.col}
            keyboardShouldPersistTaps="handled">
            {opts.map(opt => {
              const selected = path[level] === opt.value;
              return (
                <TouchableOpacity
                  key={`${level}-${String(opt.value)}`}
                  style={styles.cell}
                  activeOpacity={0.85}
                  onPress={() => handlePick(level, opt)}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.cellText,
                      {color: textColor},
                      selected ? activeStyle.txt : null,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  rowScroll: {maxHeight: 320},
  col: {
    width: 140,
    maxHeight: 320,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#eeeeee',
  },
  cell: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  cellText: {
    fontSize: 15,
  },
});
