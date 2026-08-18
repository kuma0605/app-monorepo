/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextStyle,
} from 'react-native';
import Checkbox from '@ant-design/react-native/lib/checkbox/Checkbox';
import type {DaDropdownPickerProps, DropdownItem, ColumnState} from './types';
import {Modal} from '@ant-design/react-native';
interface Props extends DaDropdownPickerProps {}

const DaDropdownPicker: React.FC<Props> = ({
  data = [],
  multiple = false,
  value = multiple ? [] : null,
  onChange = () => {},
  disabled = false,
  visible = false,
  onVisibleChange = () => {},
}) => {
  // 状态管理
  const [columns, setColumns] = useState<ColumnState[]>([]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [activeColumn, setActiveColumn] = useState(0);
  const [selectedItems, setSelectedItems] = useState<DropdownItem[]>([]);

  // 初始化数据
  useEffect(() => {
    const transformedData = transformData(data);
    setColumns([{data: transformedData, selectedValue: null}]);
    setSelectedPath(['']);
    setActiveColumn(0);

    // 处理初始值
    if (
      value &&
      (!selectedItems.length ||
        (multiple && selectedItems.length !== (value as any[]).length))
    ) {
      const initialSelected = Array.isArray(value) ? value : [value];
      setSelectedItems(initialSelected as DropdownItem[]);
    }
    if (visible === false) {
      setSelectedItems([]);
    }
  }, [data, visible]);

  // 数据转换
  const transformData = (tree: DropdownItem[]): DropdownItem[] => {
    return tree.map(node => ({
      ...node,
      label: node.label || node.name || '',
      value: node.value || node.id || '',
      children: node.children ? transformData(node.children) : undefined,
    }));
  };

  const onClose2 = () => {
    onVisibleChange(false);
  };

  // 计算可见列
  const visibleColumns = useMemo(() => {
    return columns.slice(0, activeColumn + 1);
  }, [columns, activeColumn]);

  // 处理选择
  const handleSelect = (
    item: DropdownItem,
    columnIndex: number,
    colIndex: number,
  ) => {
    if (disabled) return;

    const newPath = [...selectedPath.slice(0, columnIndex), item.value];
    if (item.children?.length) {
      // 有子级，激活下一列
      setActiveColumn(columnIndex + 1);
      setColumns(prev => {
        const newColumns = [...prev];
        newColumns[colIndex + 1] = {
          data: item.children ?? [],
          selectedValue: null,
        };
        return newColumns;
      });
      newPath.push(''); // 为下一列预留位置
    } else {
      // 叶子节点，更新选中项
      updateSelectedItems(item);
    }

    setSelectedPath(newPath);
  };

  // 更新选中项
  const updateSelectedItems = useCallback(
    (item: DropdownItem) => {
      setSelectedItems(prev => {
        let newItems: DropdownItem[] = [];
        if (multiple) {
          const index = prev.findIndex(i => i.value === item.value);
          newItems = [...prev];
          if (index > -1) {
            newItems.splice(index, 1);
          } else {
            newItems.push(item);
          }
        } else {
          newItems = [item];
        }

        return newItems;
      });
    },
    [multiple],
  );

  // 重置
  const reset = () => {
    setSelectedItems([]);
    onChange([]);
    onVisibleChange(false);
  };

  // 提交
  const submit = () => {
    onChange(selectedItems);
    onVisibleChange(false);
  };

  // 判断是否选中
  const isSelected = (item: DropdownItem): boolean => {
    return selectedItems.some(i => i.value === item.value);
  };

  // 判断是否有子级
  const hasChildren = (item: DropdownItem): boolean => {
    return !!item.children?.length;
  };

  // 渲染选项
  const renderOption = (
    item: DropdownItem,
    index: number,
    colIndex: number,
  ) => {
    const isActive = isSelected(item);

    const labelStyle: TextStyle = {
      ...styles.optionLabel,
      ...(isActive ? styles.activeOptionLabel : {}),
    };

    return (
      <TouchableOpacity
        key={index}
        style={styles.optionContainer}
        onPress={() => handleSelect(item, activeColumn, colIndex)}
        activeOpacity={0.7}
        disabled={disabled}>
        <View style={styles.optionContent}>
          <View
            style={{
              ...styles.activeIndicator,
              ...(isActive ? {backgroundColor: '#0C68F2'} : {}),
            }}
          />
          <Text style={labelStyle}>{item.label}</Text>
        </View>

        {hasChildren(item) && <Text style={styles.arrowIcon}>→</Text>}

        {multiple && isSelected(item) && (
          <Checkbox checked style={styles.checkbox} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      popup
      visible={visible}
      animationType="slide-up"
      closable
      maskClosable
      onClose={onClose2}>
      <View style={[styles.container]}>
        {/* 列容器 */}
        <View style={styles.columnsContainer}>
          {visibleColumns.map((column, colIndex) => (
            <View
              key={colIndex}
              style={{
                ...styles.column,
                ...(visibleColumns.length === colIndex + 1
                  ? {}
                  : styles.borderRight),
              }}>
              {visibleColumns.length === colIndex + 1 ? (
                <ScrollView
                  key={`scroll-${colIndex}-${activeColumn}`}
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}>
                  {column.data.map((item, rowIndex) =>
                    renderOption(item, rowIndex, colIndex),
                  )}
                </ScrollView>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}>
                  {column.data.map((item, rowIndex) =>
                    renderOption(item, rowIndex, colIndex),
                  )}
                </ScrollView>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={reset}
          disabled={disabled}>
          <Text style={{color: '#333', fontSize: 14}}>重置</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submit}
          disabled={disabled}>
          <Text style={{color: '#fff', fontSize: 14}}>
            确认{selectedItems.length ? `(${selectedItems.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: 320,
    overflow: 'hidden',
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  column: {
    flex: 1,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    borderStyle: 'solid',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'solid',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeIndicator: {
    width: 4,
    height: 16,
    marginRight: 8,
  },
  optionLabel: {
    color: '#333',
    fontSize: 14,
  },
  activeOptionLabel: {
    color: '#0C68F2',
    fontWeight: '500',
  },
  arrowIcon: {
    color: '#999',
    fontSize: 14,
    marginHorizontal: 8,
  },
  checkbox: {
    width: 0,
    height: 16,
    margin: 0,
    marginRight: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    width: '30%',
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#F5F6F9',
    alignItems: 'center',
  },
  submitButton: {
    width: '68%',
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#0C68F2',
    alignItems: 'center',
  },
});

export default DaDropdownPicker;
