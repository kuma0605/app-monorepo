import type {
  CompositeNavigationProp,
  NavigationProp,
} from '@react-navigation/native';
import type {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';

/**
 * 导航路由类型定义
 *
 * 结构：
 * - RootStack：Auth / Main（底部 Tabs）/ Root 级全屏子页
 * - 2 个 Tab：首页、我的（直接挂入口 Screen，不额外包 Stack）
 *
 * 说明：
 * - Android 使用社区 `@react-navigation/native-stack`
 * - HarmonyOS（RNOH）建议安装并使用 `@react-native-ohos/native-stack`（harmony alias 到 `@react-navigation/native-stack`）
 */

// ─── Root Bottom Tabs ─────────────────────────────────────────────────────────
export type RootTabParamList = {
  HomeTab: undefined;
  MeTab: undefined;
};

export type RootTabName = keyof RootTabParamList;

/** 我的模块 Root 级全屏子页；新增时使用 `/Me/...`。 */
export type MeRootParamList = {
  '/Me/PersonalInfo': undefined;
  '/Me/DevDemo': undefined;
};

// ─── Root Stack (Auth/Main + Root 级全屏子页) ─────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
} & MeRootParamList;

/** 与 Auth、Main 并列、在 rootStack 里注册 `name` 的 Root 级全屏页 */
export type RootStackRegisteredScreenName = Exclude<
  keyof RootStackParamList,
  'Auth' | 'Main'
>;

/**
 * Tab 页面通用 Props：既保留当前 Tab 的类型，也允许直接跳转 Root 级全屏页。
 *
 * 用法：
 * `type Props = RootTabScreenProps<'HomeTab'>;`
 */
export type RootTabScreenProps<RouteName extends RootTabName> = Omit<
  BottomTabScreenProps<RootTabParamList, RouteName>,
  'navigation'
> & {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, RouteName>,
    NavigationProp<RootStackParamList>
  >;
};
