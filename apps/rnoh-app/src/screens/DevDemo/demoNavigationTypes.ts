/**
 * DevDemo 嵌套栈专用导航类型。
 *
 * 这些路由不作为 Root 级业务页注册，只在功能演示 Stack 中使用。
 */
export type DevDemoId =
  | 'buttons'
  | 'nativewind'
  | 'reduxPersist'
  | 'flashlist'
  | 'permissions'
  | 'rnfs';

export const DEV_DEMO_TITLES: Record<DevDemoId, string> = {
  buttons: 'Button 组件示例',
  nativewind: 'NativeWind 测试',
  reduxPersist: '退出与计数',
  flashlist: 'Flash List',
  permissions: '权限',
  rnfs: 'react-native-fs',
};

export type DevDemoStackParamList = {
  DevDemoHome: undefined;
  DevDemoList: undefined;
  DevDemoDetail: {demoId: DevDemoId};
  DevDemoDetailPage: {from: 'DevDemo'; timestamp: number};
  DevDemoDocumentPicker: undefined;
  DevDemoFileViewer: undefined;
  DevDemoPullView: undefined;
  DevDemoPullList: undefined;
  DevDemoCalendar: undefined;
  DevDemoFilePicker: undefined;
  DevDemoTodoList: undefined;
  DevDemoTodoDetail: {id: string};
  DevDemoFormDemo: undefined;
  DevDemoNavComm: {selectedCompany?: {id: string; name: string}} | undefined;
  DevDemoNavCommSelect: {mode: 'official' | 'bridge'};
  DevDemoECharts: undefined;
};
