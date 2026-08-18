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
import type {DaDropdownPickerProps, DropdownItem, ColumnState} from './types';
import {Modal, Checkbox, Icon} from '@ant-design/react-native';

interface Props extends DaDropdownPickerProps {}

const DaDropdownColTreePicker: React.FC<Props> = ({
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
  const handleSelect = (item: DropdownItem, colIndex: number) => {
    if (disabled) return;

    const newPath = [...selectedPath.slice(0, colIndex), item.value];
    if (item.children?.length) {
      // 有子级，激活下一列
      setActiveColumn(colIndex + 1);
      setColumns(prev => {
        const newColumns = prev.slice(0, colIndex + 1);
        newColumns[colIndex + 1] = {
          data: item.children ?? [],
          selectedValue: null,
        };
        return newColumns;
      });
      newPath.push(''); // 为下一列预留位置
    } else {
      // 叶子节点，更新选中项
      setActiveColumn(colIndex);
      setColumns(prev => prev.slice(0, colIndex + 1));
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
    const isExpanded = selectedPath[colIndex] === item.value;

    const labelStyle: TextStyle = {
      ...styles.optionLabel,
      ...(isActive || isExpanded ? styles.activeOptionLabel : {}),
    };

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.optionContainer,
          (isActive || isExpanded) && styles.activeOptionContainer,
        ]}
        onPress={() => handleSelect(item, colIndex)}
        activeOpacity={0.7}
        disabled={disabled}>
        <Text style={labelStyle}>{item.label}</Text>

        {hasChildren(item) ? (
          <Icon
            name="right"
            size={12}
            color={isExpanded ? '#0C68F2' : '#999'}
            style={styles.arrowIcon}
          />
        ) : multiple ? (
          <Checkbox
            checked={isActive}
            disabled={disabled}
            style={styles.checkbox}
            onChange={() => handleSelect(item, colIndex)}
          />
        ) : (
          isActive && (
            <Icon
              name="check"
              size={14}
              color="#0C68F2"
              style={styles.checkIcon}
            />
          )
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
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}>
                {column.data.map((item, rowIndex) =>
                  renderOption(item, rowIndex, colIndex),
                )}
              </ScrollView>
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
    borderRightColor: '#eee',
    borderStyle: 'solid',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingLeft: 4,
    paddingRight: 6,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  activeOptionContainer: {
    backgroundColor: '#f6f9ff',
  },
  optionLabel: {
    color: '#333',
    fontSize: 14,
    flex: 1,
    marginRight: 2,
  },
  activeOptionLabel: {
    color: '#0C68F2',
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    margin: 0,
    padding: 0,
    marginLeft: 2,
  },
  checkIcon: {
    marginLeft: 2,
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
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#F5F6F9',
    alignItems: 'center',
  },
  submitButton: {
    width: '68%',
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#0C68F2',
    alignItems: 'center',
  },
});

export default DaDropdownColTreePicker;
