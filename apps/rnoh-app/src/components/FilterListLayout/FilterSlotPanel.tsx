import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Icon} from '@ant-design/react-native';

export type FilterSlotField = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

type FilterSlotPanelProps = {
  fields: FilterSlotField[];
  onReset: () => void;
  onQuery: () => void;
  onResetAll?: () => void;
};

export function FilterSlotPanel({
  fields,
  onReset,
  onQuery,
  onResetAll,
}: FilterSlotPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {fields.map((field, index) => (
          <TouchableOpacity
            key={index}
            style={styles.filterBtn}
            onPress={field.onPress}>
            <Text
              style={[
                styles.filterBtnText,
                field.selected && styles.filterBtnTextSelected,
              ]}
              numberOfLines={1}>
              {field.label}
            </Text>
            <Icon name="down" size={12} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {onResetAll ? (
        <TouchableOpacity style={styles.resetAllBtn} onPress={onResetAll}>
          <Text style={styles.resetAllText}>重置全部筛选</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetBtnText}>重置</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.queryBtn} onPress={onQuery}>
          <Text style={styles.queryBtnText}>查询</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingBottom: 30,
    paddingTop: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F9FF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  filterBtnText: {
    fontSize: 14,
    color: '#999',
    flex: 1,
    marginRight: 4,
  },
  filterBtnTextSelected: {
    color: '#333',
  },
  resetAllBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    paddingVertical: 4,
  },
  resetAllText: {
    fontSize: 13,
    color: '#0C68F2',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  resetBtn: {
    flex: 2,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0C68F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  resetBtnText: {
    color: '#0C68F2',
    fontSize: 15,
  },
  queryBtn: {
    flex: 3,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#0C68F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryBtnText: {
    color: '#fff',
    fontSize: 15,
  },
});
