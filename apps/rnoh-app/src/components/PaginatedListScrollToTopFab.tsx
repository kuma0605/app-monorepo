import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export interface PaginatedListScrollToTopFabProps {
  visible: boolean;
  onPress: () => void;
  /** 在 safe area 底边之上的额外间距（例如避开底部悬浮控件） */
  bottomOffset?: number;
}

export default function PaginatedListScrollToTopFab({
  visible,
  onPress,
  bottomOffset = 16,
}: PaginatedListScrollToTopFabProps) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  const fabBottom = insets.bottom + bottomOffset;

  return (
    <TouchableOpacity
      accessibilityLabel="回到顶部"
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.fab, {bottom: fabBottom}]}>
      <Text style={styles.arrow}>↑</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0C68F2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  arrow: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2,
  },
});
