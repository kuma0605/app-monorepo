/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './index.js', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('@react-native-ohos/nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
