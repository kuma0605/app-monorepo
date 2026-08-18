import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useAppSelector} from '../store/hooks';

export function LoadingOverlay() {
  const isLoading = useAppSelector(state => state.global.isLoading);

  if (!isLoading) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="auto">
      <View style={styles.mask}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    elevation: 10000,
  },
  mask: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    alignItems: 'center',
  },
});
