import './global.css';
import React from 'react';
import {StyleSheet, View, LogBox} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as AntProvider} from '@ant-design/react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/store';
import {RootNavigator} from './src/navigation/RootNavigator';
import {LoadingOverlay} from './src/components/LoadingOverlay';
import {AppUpdateManager} from './src/components/AppUpdateManager';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);

if (__DEV__) {
  console.log('Hermes?', !!(global as any).HermesInternal);
}

/**
 * App 入口
 *
 * 职责：仅负责挂载全局 Provider 和根导航，不包含任何业务逻辑。
 */
export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <View style={styles.appRoot}>
              <AntProvider>
                <RootNavigator />
                <AppUpdateManager />
              </AntProvider>
              <LoadingOverlay />
            </View>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
});
