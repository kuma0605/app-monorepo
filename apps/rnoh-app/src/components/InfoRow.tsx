import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface InfoRowProps {
  label: string;
  value?: string | number | null;
}

export function InfoRow({label, value}: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value && value !== '' ? value : '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    color: '#999',
    flexShrink: 0,
    marginRight: 12,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
});
