import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';

import {defaultSubStackScreenOptions} from './defaultSubStackScreenOptions';
import {ROOT_STACK_SCREEN_REGISTRY} from './rootStackScreenRegistry';
import type {RootStackParamList} from './types';
import {MainTabs} from './mainTabs';
import LoginScreen from '../screens/Login';
import {useAppSelector} from '@/store/hooks';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Android（以及支持 native-stack 的平台）：Root 使用 Native Stack。
 *
 * 页面：
 * - Auth：登录页（全屏）
 * - Main：底部 Tabs
 * - 首页子业务屏：与 Main 同级，无底部 Tab
 */
export function RootStackNavigator() {
  const isLoggedIn = useAppSelector(state => state.user.isLoggedIn);

  return (
    <NavigationContainer
      onReady={() => {
        requestAnimationFrame(() => SplashScreen.hide());
      }}>
      <Stack.Navigator
        screenOptions={({route, navigation}) => {
          if (route.name === 'Main' || route.name === 'Auth') {
            return {headerShown: false};
          }
          return defaultSubStackScreenOptions({navigation});
        }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            {ROOT_STACK_SCREEN_REGISTRY.map(({name, component, options}) => (
              <Stack.Screen
                key={name}
                name={name}
                component={component as any}
                options={options}
              />
            ))}
          </>
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
