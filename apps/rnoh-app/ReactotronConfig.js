import Reactotron from 'reactotron-react-native';

// 1. 获取本机 IP (Mac): `ifconfig en0 | awk '/inet / {print $2}'`
// 2. 修改 `ReactotronConfig.js`:

Reactotron.configure({
  name: 'SAMRApp',
  host: '172.168.8.167', // 默认 localhost，但推荐使用本机 IP，避免 VPN 环境下连接失败
  port: 9090,
}) // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .connect(); // let's connect!
