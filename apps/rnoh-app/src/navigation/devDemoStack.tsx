import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {defaultSubStackScreenOptions} from './defaultSubStackScreenOptions';
import DevDemoListScreen from '@/screens/DevDemo/DemoList';
import DevDemoDetailScreen from '@/screens/DevDemo/DemoDetail';
import DetailScreen from '@/screens/DevDemo/Detail';
import DocumentPickerDemo from '@/screens/DevDemo/DocumentPickerDemo';
import FileViewerDemo from '@/screens/DevDemo/FileViewerDemo';
import PullViewDemo from '@/screens/DevDemo/pull/PullViewDemo';
import PullListDemo from '@/screens/DevDemo/pull/PullListDemo';
import CalendarDemo from '@/screens/DevDemo/CalendarDemo';
import FilePickerDemo from '@/screens/DevDemo/FilePickerDemo';
import DemoTodoListScreen from '@/screens/DevDemo/DemoTodoList';
import DemoTodoDetailScreen from '@/screens/DevDemo/demoTodoList/DemoTodoDetail';
import DevDemoFormDemoScreen from '@/screens/DevDemo/FormDemo';
import DevDemoNavCommScreen from '@/screens/DevDemo/NavCommDemo';
import DevDemoNavCommSelectScreen from '@/screens/DevDemo/NavCommSelectDemo';
import EChartsDemo from '@/screens/DevDemo/EChartsDemo';
import {
  DEV_DEMO_TITLES,
  type DevDemoStackParamList,
} from '@/screens/DevDemo/demoNavigationTypes';
import {SUB_STACK_HEADER_BG} from '@/theme/colors';

const Stack = createNativeStackNavigator<DevDemoStackParamList>();

/**
 * 功能演示嵌套栈：从「我的」进入，承载 Demo 页面。
 */
export function DevDemoStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DevDemoList"
      screenOptions={({navigation}) =>
        defaultSubStackScreenOptions({navigation})
      }>
      <Stack.Screen
        name="DevDemoList"
        component={DevDemoListScreen}
        options={{title: '功能演示'}}
      />
      <Stack.Screen
        name="DevDemoDetail"
        component={DevDemoDetailScreen}
        options={({route}) => ({
          title: DEV_DEMO_TITLES[route.params.demoId],
        })}
      />
      <Stack.Screen
        name="DevDemoDetailPage"
        component={DetailScreen}
        options={{title: '导航详情页'}}
      />
      <Stack.Screen
        name="DevDemoDocumentPicker"
        component={DocumentPickerDemo}
        options={{title: '文件选择器'}}
      />
      <Stack.Screen
        name="DevDemoFileViewer"
        component={FileViewerDemo}
        options={{title: '文件预览'}}
      />
      <Stack.Screen
        name="DevDemoPullView"
        component={PullViewDemo}
        options={{title: 'PullView'}}
      />
      <Stack.Screen
        name="DevDemoPullList"
        component={PullListDemo}
        options={{title: 'PullList'}}
      />
      <Stack.Screen
        name="DevDemoCalendar"
        component={CalendarDemo}
        options={{title: 'Calendar 日历'}}
      />
      <Stack.Screen
        name="DevDemoFilePicker"
        component={FilePickerDemo}
        options={{title: '文件选择器（上传+预览）'}}
      />
      <Stack.Screen
        name="DevDemoTodoList"
        component={DemoTodoListScreen}
        options={{
          title: '完整列表示例',
          contentStyle: {backgroundColor: SUB_STACK_HEADER_BG},
        }}
      />
      <Stack.Screen
        name="DevDemoTodoDetail"
        component={DemoTodoDetailScreen}
        options={{title: '待办详情'}}
      />
      <Stack.Screen
        name="DevDemoFormDemo"
        component={DevDemoFormDemoScreen}
        options={{title: '表单综合示例'}}
      />
      <Stack.Screen
        name="DevDemoNavComm"
        component={DevDemoNavCommScreen}
        options={{title: '页面通信对比演示'}}
      />
      <Stack.Screen
        name="DevDemoNavCommSelect"
        component={DevDemoNavCommSelectScreen}
        options={{title: '选择企业（模式演示）'}}
      />
      <Stack.Screen
        name="DevDemoECharts"
        component={EChartsDemo}
        options={{title: 'ECharts 图表示例'}}
      />
    </Stack.Navigator>
  );
}
