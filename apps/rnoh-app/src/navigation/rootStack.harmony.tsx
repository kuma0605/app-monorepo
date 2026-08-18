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
 * HarmonyOS：根据官方文档，react-native-screens 未实现原生化（enableScreens(false)），
 * Root 使用 JS Stack（@react-navigation/stack）。
 */
export function RootStackNavigator() {
  const isLoggedIn = useAppSelector(state => state.user.isLoggedIn);

  return (
    <NavigationContainer
      onReady={() => {
        // Harmony: 给首帧一点时间，避免 splash 关闭后短暂白屏
        requestAnimationFrame(() => setTimeout(() => SplashScreen.hide(), 50));
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
