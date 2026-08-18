module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
    'react-native/no-inline-styles': 'warn',
    'prettier/prettier': 'error',
    'react/no-unstable-nested-components': ['warn', {allowAsProps: true}],
  },
};
