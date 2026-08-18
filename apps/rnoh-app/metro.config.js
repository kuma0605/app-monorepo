const path = require('path');
const {mergeConfig, getDefaultConfig} = require('@react-native/metro-config');
const {
  createHarmonyMetroConfig,
} = require('@react-native-oh/react-native-harmony/metro.config');
const {withNativeWind} = require('@react-native-ohos/nativewind/metro');
const {AsyncLocalStorage} = require('async_hooks');

const platformStorage = new AsyncLocalStorage();
let latestPlatform = null;

// ① 先拿到 RN 默认配置
const defaultConfig = getDefaultConfig(__dirname);

// ② 把 harmony 加入平台列表（保持已有平台不变）
defaultConfig.resolver.platforms = [
  ...(defaultConfig.resolver.platforms || []),
  'harmony',
];

// ③ 为 '@/...' 提供别名解析（与 0.77 一致：extraNodeModules 映射到 src）
defaultConfig.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, 'src'),
};

// ④ 确保 Metro 能监视 src 目录下的别名路径
defaultConfig.watchFolders = [path.resolve(__dirname, 'src')];

const harmonyConfig = createHarmonyMetroConfig({
  reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony',
});

// ⑤ 你自己的额外 transformer 配置
const extraConfig = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

// ⑥ 合并：默认配置 + RNOH harmony 配置 + extraConfig
const mergedConfig = mergeConfig(defaultConfig, harmonyConfig, extraConfig);

// Wrap the resolver to capture the latest platform (for CLI builds)
const originalResolveRequest = mergedConfig.resolver.resolveRequest;
if (originalResolveRequest) {
  mergedConfig.resolver.resolveRequest = (ctx, moduleName, platform) => {
    latestPlatform = platform;
    return originalResolveRequest(ctx, moduleName, platform);
  };
}

// Enhance server middleware to capture the platform parameter (for dev server requests)
const originalEnhanceMiddleware = mergedConfig.server?.enhanceMiddleware;
mergedConfig.server = {
  ...mergedConfig.server,
  enhanceMiddleware: (middleware, server) => {
    const enhanced = originalEnhanceMiddleware
      ? originalEnhanceMiddleware(middleware, server)
      : middleware;

    return (req, res, next) => {
      let platform = null;
      if (req.url) {
        const urlMatch = req.url.match(/[?&]platform=([^&]+)/);
        if (urlMatch) {
          platform = urlMatch[1];
        }
      }

      if (platform) {
        return platformStorage.run(platform, () => {
          return enhanced(req, res, next);
        });
      }
      return enhanced(req, res, next);
    };
  },
};

// Set correct modules to run before the main module based on the active platform
mergedConfig.serializer = {
  ...mergedConfig.serializer,
  getModulesRunBeforeMainModule: entryPoint => {
    const platform = platformStorage.getStore() || latestPlatform;
    if (platform === 'harmony') {
      return [
        require.resolve(
          '@react-native-oh/react-native-harmony/Libraries/Core/InitializeCore',
        ),
      ];
    }
    return [require.resolve('react-native/Libraries/Core/InitializeCore')];
  },
};

// ⑦ NativeWind（0.77 同款；指向全局 CSS 入口）
module.exports = withNativeWind(mergedConfig, {input: './global.css'});
