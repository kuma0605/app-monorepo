/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type {DaDropdownPickerProps, DropdownItem} from './types';
import {Modal, Checkbox, Icon} from '@ant-design/react-native';

interface Props extends DaDropdownPickerProps {}

const DaDropdownTreePicker: React.FC<Props> = ({
  data = [],
  multiple = false,
  value = multiple ? [] : null,
  onChange = () => {},
  disabled = false,
  visible = false,
  onVisibleChange = () => {},
}) => {
  // 选中的项列表
  const [selectedItems, setSelectedItems] = useState<DropdownItem[]>([]);
  // 展开的节点 values
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // 数据转化 (递归转换 label, value 等字段)
  const transformData = (tree: DropdownItem[]): DropdownItem[] => {
    return tree.map(node => ({
      ...node,
      label: node.label || node.name || '',
      value: node.value || node.id || '',
      children: node.children ? transformData(node.children) : undefined,
    }));
  };

  const transformedData = useMemo(() => {
    return transformData(data);
  }, [data]);

  // 当显隐性发生变化或者传入 value 发生变化时，同步选中状态
  useEffect(() => {
    if (visible) {
      if (value) {
        const initialSelected = Array.isArray(value) ? value : [value];
        setSelectedItems(initialSelected as DropdownItem[]);
      } else {
        setSelectedItems([]);
      }
    }
  }, [visible, value]);

  const onClose2 = () => {
    onVisibleChange(false);
  };

  // 展开折叠节点
  const toggleExpand = (val: string) => {
    setExpandedKeys(prev => ({
      ...prev,
      [val]: !prev[val],
    }));
  };

  // 处理选择
  const handleSelect = (item: DropdownItem) => {
    if (disabled) return;

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
  };

  // 重置
  const reset = () => {
    setSelectedItems([]);
    onChange([]);
    onVisibleChange(false);
  };

  // 确认提交
  const submit = () => {
    onChange(multiple ? selectedItems : selectedItems[0] || null);
    onVisibleChange(false);
  };

  // 判断节点是否被选中
  const isSelected = (item: DropdownItem): boolean => {
    return selectedItems.some(i => i.value === item.value);
  };

  // 递归渲染树节点
  const renderNode = (item: DropdownItem, depth: number = 0) => {
    const hasChild = !!item.children?.length;
    const isExpanded = !!expandedKeys[item.value];
    const isNodeSelected = isSelected(item);

    return (
      <View key={item.value} style={{width: '100%'}}>
        {/* 节点行 */}
        <TouchableOpacity
          style={[
            styles.nodeRow,
            {paddingLeft: 16 + depth * 20},
            isNodeSelected && styles.activeNodeRow,
          ]}
          onPress={() => {
            if (hasChild) {
              toggleExpand(item.value);
            } else {
              handleSelect(item);
            }
          }}
          activeOpacity={0.7}
          disabled={disabled}>
          {/* 折叠/展开的前缀图标 */}
          <View style={styles.prefixIconContainer}>
            {hasChild ? (
              <Icon
                name={isExpanded ? 'down' : 'right'}
                size={14}
                color="#666"
              />
            ) : null}
          </View>

          {/* 节点文本内容 */}
          <Text style={styles.nodeLabel}>{item.label}</Text>

          {/* 右侧动作图标或复选框 */}
          <View style={styles.actionContainer}>
            {hasChild ? null : multiple ? (
              <Checkbox
                checked={isNodeSelected}
                disabled={disabled}
                onChange={() => handleSelect(item)}
              />
            ) : (
              isNodeSelected && <Icon name="check" size={16} color="#0C68F2" />
            )}
          </View>
        </TouchableOpacity>

        {/* 递归渲染子级 */}
        {hasChild && isExpanded && (
          <View style={styles.childrenContainer}>
            {item.children?.map(child => renderNode(child, depth + 1))}
          </View>
        )}
      </View>
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
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          {transformedData.map(node => renderNode(node, 0))}
        </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380, // 树形结构可适当调高，方便展示层级结构
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f5f5f5',
  },
  activeNodeRow: {
    backgroundColor: '#f6f9ff',
  },
  prefixIconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  actionContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childrenContainer: {
    width: '100%',
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

export default DaDropdownTreePicker;
