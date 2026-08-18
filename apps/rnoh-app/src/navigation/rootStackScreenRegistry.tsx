import type {ComponentType} from 'react';

import type {RootStackRegisteredScreenName} from './types';

type RootStackScreen = ComponentType<Record<string, unknown>>;

type RootStackScreenEntry = {
  name: RootStackRegisteredScreenName;
  component: RootStackScreen;
  options: {title: string; headerShown?: boolean};
};

/**
 * 懒加载屏幕包装器：
 * 将 require 延迟到首次导航时才执行，减少启动开销。
 * 返回大写开头的命名函数，避免 React Navigation inline-function 警告。
 */
function lazyScreen(getter: () => RootStackScreen): RootStackScreen {
  function LazyScreen(props: Record<string, unknown>) {
    const Cmp = getter();
    return (Cmp as Function)(props) as React.ReactElement;
  }
  return LazyScreen as unknown as RootStackScreen;
}

const ROOT_STACK_SCREENS_ME_TAB: RootStackScreenEntry[] = [
  {
    name: '/Me/PersonalInfo',
    component: lazyScreen(
      () => require('@/screens/Me/PersonalInfo').default as RootStackScreen,
    ),
    options: {title: '个人信息'},
  },
  {
    name: '/Me/DevDemo',
    component: lazyScreen(
      () =>
        require('@/navigation/devDemoStack')
          .DevDemoStackNavigator as RootStackScreen,
    ),
    options: {title: '功能演示', headerShown: false},
  },
];

/**
 * 供 Root Stack 与 Main 并列注册的 Screen 列表。
 * 路由名与 params 以 types.ts 中 `RootStackParamList`（及 `RootStackRegisteredScreenName`）为准。
 */
export const ROOT_STACK_SCREEN_REGISTRY: RootStackScreenEntry[] = [
  ...ROOT_STACK_SCREENS_ME_TAB,
];
