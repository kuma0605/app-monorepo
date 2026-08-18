import React, {useCallback, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {PullList} from '@react-native-ohos/react-native-pull';

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

const buildItems = (count: number, offset = 0) =>
  Array.from({length: count}, (_, i) => ({
    id: i + 1 + offset,
    title: `------>Item${i + 1 + offset}`,
  }));

export default function PullListDemo() {
  const [data, setData] = useState<PullDebug>(initialDebug);
  const [stateList, setStateList] = useState(() => buildItems(12, 0));

  const onPulling = useCallback(() => {
    setData(prev => ({...prev, pulling: 'pulling--------->'}));
  }, []);

  const onPullOk = useCallback(() => {
    setData(prev => ({...prev, pullok: 'pullok--------->'}));
  }, []);

  const onPullRelease = useCallback((resolve: () => void) => {
    setData(prev => ({...prev, pullrelease: 'pullrelease--------->'}));
    setTimeout(() => {
      setStateList(buildItems(12, 0));
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
        label = '当前 PullList 状态: pulling...';
      } else if (pullok) {
        label = '当前 PullList 状态: pullok...';
      } else if (pullrelease) {
        label = '当前 PullList 状态: pullrelease...';
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

  const renderHeader = useCallback(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>This is header</Text>
      </View>
    );
  }, []);

  const renderRow = useCallback(
    ({item}: {item: {id: number; title: string}}) => {
      return (
        <View style={styles.row}>
          <Text>{item.title}</Text>
        </View>
      );
    },
    [],
  );

  const renderFooter = useCallback(() => {
    return (
      <View style={styles.footer}>
        <ActivityIndicator />
      </View>
    );
  }, []);

  const loadMore = useCallback(() => {
    setTimeout(() => {
      setStateList(prev => {
        const list: {id: number; title: string}[] = [];
        const num = prev.length;
        for (let i = 0; i < 5; i += 1) {
          list.push({
            id: i + 1 + num,
            title: `------>Item${i + num + 1}`,
          });
        }
        return [...prev, ...list];
      });
    }, 1000);
  }, []);

  const w = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <PullList
        style={{width: w}}
        onPulling={onPulling}
        onPullOk={onPullOk}
        isPullEnd
        onPullRelease={onPullRelease}
        onPushing={onPushing}
        topIndicatorRender={topIndicatorRender}
        topIndicatorHeight={60}
        scrollEventThrottle={16}
        initialNumToRender={5}
        onEndReached={loadMore}
        onEndReachedThreshold={0.25}
        renderItem={renderRow}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        data={stateList}
        keyExtractor={(item: {id: number}) => String(item.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F5FCFF',
    width: '100%',
    height: '100%',
  },
  inner: {
    backgroundColor: '#eeeeee',
  },
  header: {
    height: 50,
    backgroundColor: '#eeeeee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
  },
  row: {
    height: 50,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
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
