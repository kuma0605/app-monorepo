module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    '@react-native-ohos/nativewind/babel',
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
