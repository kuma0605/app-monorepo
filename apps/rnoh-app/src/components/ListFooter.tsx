import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';

interface ListFooterProps {
  loadingMore: boolean;
  hasMore: boolean;
  isEmpty: boolean;
}

const ListFooter: React.FC<ListFooterProps> = ({
  loadingMore,
  hasMore,
  isEmpty,
}) => {
  if (loadingMore) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color="#0C68F2" />
        <Text style={styles.footerText}>加载中...</Text>
      </View>
    );
  }
  if (!hasMore && !isEmpty) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>没有更多数据了</Text>
      </View>
    );
  }
  return <View style={styles.footer} />;
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
});

export default ListFooter;
