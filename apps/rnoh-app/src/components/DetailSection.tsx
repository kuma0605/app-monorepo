import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Icon} from '@ant-design/react-native';

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  /** 展开区顶部分隔线；内含 Form 时关闭，避免与 Form.Item 顶线重复 */
  bodyDivider?: boolean;
}

export function DetailSection({
  title,
  children,
  defaultExpanded = true,
  bodyDivider = true,
}: DetailSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}>
        <Text style={styles.title}>{title}</Text>
        <Icon name={expanded ? 'down' : 'right'} color="#BFBFBF" size={14} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          {bodyDivider ? <View style={styles.divider} /> : null}
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
  },
});
