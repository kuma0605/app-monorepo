import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Image, StyleSheet} from 'react-native';

import type {RootTabParamList} from './types';
import HomeScreen from '../screens/Home';
import MeScreen from '../screens/Me';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS = {
  HomeTab: {
    normal: require('@/assets/tabbar/home.png'),
    selected: require('@/assets/tabbar/homeSelect.png'),
  },
  MeTab: {
    normal: require('@/assets/tabbar/my.png'),
    selected: require('@/assets/tabbar/mySelect.png'),
  },
} as const;

function TabBarIcon({
  focused,
  routeName,
}: {
  focused: boolean;
  routeName: keyof typeof TAB_ICONS;
}) {
  const icons = TAB_ICONS[routeName];
  return (
    <Image
      source={focused ? icons.selected : icons.normal}
      style={styles.icon}
      resizeMode="contain"
    />
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0C68F2',
        tabBarInactiveTintColor: '#999',
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          headerShown: false,
          title: '首页',
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} routeName="HomeTab" />
          ),
        }}
      />
      <Tab.Screen
        name="MeTab"
        component={MeScreen}
        options={{
          title: '我的',
          tabBarIcon: ({focused}) => (
            <TabBarIcon focused={focused} routeName="MeTab" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
});
