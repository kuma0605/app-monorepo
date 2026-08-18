import React, {useCallback, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {PullView} from '@react-native-ohos/react-native-pull';

type PullDebug = {
  pulling: string;
  pullok: string;
  pullrelease: string;
  pushing: string;
};

const initialDebug: PullDebug = {
  pulling: '',
  pullok: '',
  pullrelease: '',
  pushing: '',
};

export default function PullViewDemo() {
  const [data, setData] = useState<PullDebug>(initialDebug);

  const onPulling = useCallback(() => {
    setData(prev => ({...prev, pulling: 'pulling--------->'}));
  }, []);

  const onPullOk = useCallback(() => {
    setData(prev => ({...prev, pullok: 'pullok--------->'}));
  }, []);

  const onPullRelease = useCallback((resolve: () => void) => {
    setData(prev => ({...prev, pullrelease: 'pullrelease--------->'}));
    setTimeout(() => {
      resolve();
    }, 3000);
  }, []);

  const onPushing = useCallback((gesturePosition: {x: number; y: number}) => {
    setData(prev => ({
      ...prev,
      pushing: `x:${gesturePosition.x}------y：${gesturePosition.y}`,
    }));
  }, []);

  const topIndicatorRender = useCallback(
    (pulling: boolean, pullok: boolean, pullrelease: boolean) => {
      let label = '';
      if (pulling) {
        label = '下拉刷新 pulling...';
      } else if (pullok) {
        label = '松开刷新 pullok...';
      } else if (pullrelease) {
        label = '玩命刷新中 pullrelease...';
      }
      return (
        <View style={styles.indicatorRow}>
          <ActivityIndicator size="small" color="gray" />
          {label ? <Text style={styles.indicatorText}>{label}</Text> : null}
        </View>
      );
    },
    [],
  );

  const w = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <PullView
        style={{width: w}}
        onPulling={onPulling}
        onPullOk={onPullOk}
        isPullEnd
        onPullRelease={onPullRelease}
        onPushing={onPushing}
        topIndicatorRender={topIndicatorRender}
        topIndicatorHeight={60}>
        <View style={styles.inner}>
          <Text>1 ***************</Text>
          <Text>onPulling: {data.pulling}</Text>
          <Text>3</Text>
          <Text>onPullOk: {data.pullok}</Text>
          <Text>5</Text>
          <Text>onPullRelease: {data.pullrelease}</Text>
          <Text>7</Text>
          <Text>onPushing: {data.pushing}</Text>
          <Text>9</Text>
        </View>
      </PullView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  inner: {
    backgroundColor: '#eeeeee',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  indicatorText: {
    marginLeft: 8,
  },
});
