// 应用全局配置

/** 当前版本号，与 app.json / build.gradle / Info.plist 保持同步 */
export const APP_VERSION = '1.0.0';

/** 是否为开发模式（由 Metro Bundler 注入） */
export const IS_DEV = __DEV__;

/** 平台标识常量 */
export const Platform = {
  IOS: 'ios',
  ANDROID: 'android',
  HARMONY: 'harmony',
} as const;

export type PlatformType = (typeof Platform)[keyof typeof Platform];

/** 功能开关（Feature Flags） */
export const FeatureFlags = {
  /** 是否启用日志上报 */
  ENABLE_LOGGING: !__DEV__,
  /** 是否启用崩溃监控 */
  ENABLE_CRASH_REPORT: !__DEV__,
  /** 是否启用新版 UI */
  ENABLE_NEW_UI: false,
} as const;

/** 本地存储 Key 枚举，统一管理避免拼写错误 */
export const StorageKeys = {
  ACCESS_TOKEN: '@mars/access_token',
  REFRESH_TOKEN: '@mars/refresh_token',
  USER_INFO: '@mars/user_info',
  THEME_MODE: '@mars/theme_mode',
  LANGUAGE: '@mars/language',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
