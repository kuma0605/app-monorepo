import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Button,
  Platform,
  ToastAndroid,
  Alert,
  TextInput,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {FlashList} from '@shopify/flash-list';
import RTNPermissions, {Permission} from 'react-native-permissions';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

import {PlatformButton} from '@/components/PlatformButton';
import {useTheme} from '@/hooks/useTheme';
import type {DevDemoStackParamList} from './demoNavigationTypes';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {incrementCount, login, logout} from '@/store/slices/userSlice';

type Props = NativeStackScreenProps<DevDemoStackParamList, 'DevDemoDetail'>;

const FLASH_DATA = [{title: 'First Item'}, {title: 'Second Item'}];
const DEFAULT_RNFS_DIR = 'rnfs-demo';

const CAMERA_PERMISSION = Platform.select({
  android: 'android.permission.CAMERA',
  ios: 'ios.permission.CAMERA',
  harmony: 'ohos.permission.CAMERA',
});

console.log('CAMERA_PERMISSION', CAMERA_PERMISSION);

function showTip(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('提示', msg);
  }
}

function normalizeDirectoryName(value: string) {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '');
  return normalized || DEFAULT_RNFS_DIR;
}

export default function DevDemoDetailScreen({route}: Props) {
  const {demoId} = route.params;
  const {colors, spacing, borderRadius, typography} = useTheme();
  const {profile, loginCount, isLoggedIn} = useAppSelector(s => s.user);
  const dispatch = useAppDispatch();
  const [rnfsDirName, setRnfsDirName] = useState(DEFAULT_RNFS_DIR);
  const [rnfsLog, setRnfsLog] = useState('等待执行文件系统测试...');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          padding: spacing.md,
          paddingBottom: spacing.xxl,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        cardTitle: {
          ...typography.h4,
          color: colors.text,
          marginBottom: spacing.md,
        },
        body: {
          ...typography.body1,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        },
        buttonPrimary: {
          backgroundColor: colors.primary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        buttonPrimaryText: {
          ...typography.button,
          color: '#FFFFFF',
        },
        buttonOutline: {
          borderWidth: 1.5,
          borderColor: colors.primary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
        },
        buttonOutlineText: {
          ...typography.button,
          color: colors.primary,
        },
        mixed: {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        flashWrap: {
          flex: 1,
          minHeight: 280,
          marginTop: spacing.sm,
        },
        flashLabel: {
          ...typography.body2,
          color: colors.text,
          marginBottom: spacing.sm,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          color: colors.text,
          marginBottom: spacing.md,
        },
        pathText: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        },
        logBox: {
          backgroundColor: colors.background,
          borderRadius: borderRadius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
          marginTop: spacing.md,
        },
        logText: {
          ...typography.caption,
          color: colors.text,
        },
      }),
    [colors, spacing, borderRadius, typography],
  );

  const rnfsDir = normalizeDirectoryName(rnfsDirName);
  const rnfsDirPath = `${RNFS.DocumentDirectoryPath}/${rnfsDir}`;
  const rnfsFilePath = `${rnfsDirPath}/hello.txt`;

  const runRnfsExample = async () => {
    try {
      await RNFS.mkdir(rnfsDirPath);
      const content = `Hello react-native-fs\nplatform=${
        Platform.OS
      }\ntime=${new Date().toISOString()}`;
      await RNFS.writeFile(rnfsFilePath, content, 'utf8');
      const exists = await RNFS.exists(rnfsFilePath);
      const readContent = await RNFS.readFile(rnfsFilePath, 'utf8');
      const log = [
        '创建目录成功',
        `目录: ${rnfsDirPath}`,
        `文件: ${rnfsFilePath}`,
        `文件存在: ${exists ? '是' : '否'}`,
        '读取内容:',
        readContent,
      ].join('\n');
      console.info('RNFS demo success', log);
      setRnfsLog(log);
      showTip('react-native-fs 测试成功');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('RNFS demo failed', err);
      setRnfsLog(`执行失败:\n${message}`);
      showTip(`react-native-fs 测试失败: ${message}`);
    }
  };

  const openRnfsFilePreview = async () => {
    try {
      const exists = await RNFS.exists(rnfsFilePath);
      if (!exists) {
        showTip('请先创建并写入测试文件');
        return;
      }
      await FileViewer.open(rnfsFilePath, {displayName: 'hello.txt'});
      showTip('已调用系统文件预览');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setRnfsLog(prev => `${prev}\n\n预览失败:\n${message}`);
      showTip(`文件预览失败: ${message}`);
    }
  };

  const cleanupRnfsExample = async () => {
    try {
      const exists = await RNFS.exists(rnfsDirPath);
      if (exists) {
        await RNFS.unlink(rnfsDirPath);
      }
      setRnfsLog(`已删除测试目录:\n${rnfsDirPath}`);
      showTip('测试目录已删除');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('RNFS cleanup failed', err);
      setRnfsLog(`删除失败:\n${message}`);
      showTip(`删除失败: ${message}`);
    }
  };

  if (demoId === 'flashlist') {
    return (
      <View style={[styles.container, {padding: spacing.md}]}>
        <Text style={styles.body}>
          FlashList 需要确定高度，此处使用 flex 容器承载列表。
        </Text>
        <View style={styles.flashWrap}>
          <Text style={styles.flashLabel}>FlashList:</Text>
          <FlashList
            data={FLASH_DATA}
            renderItem={({item}) => (
              <Text style={{paddingVertical: 8, color: colors.text}}>
                {item.title}
              </Text>
            )}
            estimatedItemSize={48}
          />
        </View>
      </View>
    );
  }

  const content = (() => {
    switch (demoId) {
      case 'buttons':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>TouchableOpacity</Text>
            <TouchableOpacity style={styles.buttonPrimary} activeOpacity={0.8}>
              <Text style={styles.buttonPrimaryText}>主要操作（Primary）</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonOutline} activeOpacity={0.8}>
              <Text style={styles.buttonOutlineText}>次要操作（Outline）</Text>
            </TouchableOpacity>
            <View style={{marginTop: spacing.md}}>
              <PlatformButton title="点我" theme="primary" />
            </View>
          </View>
        );
      case 'nativewind':
        return (
          <View style={styles.card} className="mt-1">
            <Text style={styles.cardTitle}>className 样式</Text>
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1 bg-blue-500 rounded-lg p-3 items-center">
                <Text className="text-white font-bold text-sm">Primary</Text>
              </View>
              <View className="flex-1 bg-emerald-500 rounded-lg p-3 items-center">
                <Text className="text-white font-bold text-sm">Success</Text>
              </View>
              <View className="flex-1 bg-rose-500 rounded-lg p-3 items-center">
                <Text className="text-white font-bold text-sm">Danger</Text>
              </View>
            </View>
            <View
              style={styles.mixed}
              className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 flex-row items-center">
              <Text className="text-yellow-800 text-sm flex-1">
                ✅ NativeWind 生效！className 和 StyleSheet 可混用。
              </Text>
            </View>
          </View>
        );
      case 'reduxPersist':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Redux + 持久化</Text>
            <Text style={styles.body}>
              用户 slice 经 redux-persist 写入 AsyncStorage，重启应用后可观察
              loginCount 等字段是否保留（退出会清空
              token，计数仍可能保留，视业务而定）。
            </Text>
            <Text style={[styles.body, {color: colors.text}]}>
              当前用户: {profile?.name}
            </Text>
            <Text style={[styles.body, {color: colors.text}]}>
              登录次数: {loginCount}
            </Text>
            {!isLoggedIn ? (
              <Button
                title="点击登录（演示）"
                onPress={() =>
                  dispatch(
                    login({
                      profile: {name: '张三'},
                      accessToken: 'demo-access-token',
                    }),
                  )
                }
              />
            ) : (
              <Button title="退出登录" onPress={() => dispatch(logout())} />
            )}
            <View style={{height: spacing.sm}} />
            <Button
              title="点击计数（每次 +1）"
              onPress={() => dispatch(incrementCount())}
            />
          </View>
        );
      case 'permissions':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>相机权限</Text>
            <Text style={styles.body}>
              Android 使用 android.permission.CAMERA；HarmonyOS 使用
              ohos.permission.CAMERA。
            </Text>
            <Button
              title="查询相机权限"
              onPress={async () => {
                const check = await RTNPermissions.check(
                  CAMERA_PERMISSION as Permission,
                );
                console.info('RTNPermissions check', check);
                showTip(`${check} ===== ${CAMERA_PERMISSION}`);
              }}
            />
            <View style={{height: spacing.sm}} />
            <Button
              title="请求相机权限"
              onPress={async () => {
                const request = await RTNPermissions.request(
                  CAMERA_PERMISSION as Permission,
                );
                console.info('RTNPermissions request', request);
                showTip(`${request} ===== ${CAMERA_PERMISSION}`);
              }}
            />
          </View>
        );
      case 'rnfs':
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>react-native-fs 文件系统测试</Text>
            <Text style={styles.body}>
              Android 与 HarmonyOS 都使用 DocumentDirectoryPath，测试会在 App
              私有目录下创建文件夹并写入 hello.txt。
            </Text>
            <TextInput
              style={styles.input}
              value={rnfsDirName}
              placeholder="输入测试文件夹名"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setRnfsDirName}
            />
            <Text style={styles.pathText}>目录: {rnfsDirPath}</Text>
            <Text style={styles.pathText}>文件: {rnfsFilePath}</Text>
            <Button title="创建目录并写入文件" onPress={runRnfsExample} />
            <View style={{height: spacing.sm}} />
            <Button title="系统预览 hello.txt" onPress={openRnfsFilePreview} />
            <View style={{height: spacing.sm}} />
            <Button title="删除测试目录" onPress={cleanupRnfsExample} />
            <View style={styles.logBox}>
              <Text style={styles.logText}>{rnfsLog}</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  })();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  );
}
