import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import {Icon} from '@ant-design/react-native';
import {useTheme} from '@/hooks/useTheme';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {logout} from '@/store/slices/userSlice';
import {useAppUpdate} from '@/hooks/useAppUpdate';
import type {RootTabScreenProps} from '@/navigation/types';

type Props = RootTabScreenProps<'MeTab'>;

const {version: CURRENT_VERSION} = require('../../../package.json');

interface MenuItem {
  title: string;
  icon: string;
  onPress: () => void;
  showUpdateDot?: boolean;
  value?: string;
}

export default function MeScreen({navigation}: Props) {
  const {colors, spacing, typography, borderRadius} = useTheme();
  const dispatch = useAppDispatch();
  const {profile, isLoggedIn} = useAppSelector(state => state.user);
  const {hasUpdate, checkForUpdate} = useAppUpdate();

  const handleCheckUpdate = async () => {
    try {
      const res = await checkForUpdate(true);
      if (!res || !res.hasUpdate) {
        Alert.alert('检查更新', `当前已是最新版本 v${CURRENT_VERSION}`);
      }
    } catch {
      Alert.alert('检查更新', '检查更新失败，请稍后重试');
    }
  };

  const handleLogout = () => {
    Alert.alert('确认退出', '退出后将返回登录页', [
      {text: '取消', style: 'cancel'},
      {
        text: '退出',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      title: '个人信息',
      icon: 'user',
      onPress: () => navigation.navigate('/Me/PersonalInfo'),
    },
    {
      title: '功能演示',
      icon: 'appstore',
      onPress: () => navigation.navigate('/Me/DevDemo'),
    },
    {
      title: '检查更新',
      icon: 'sync',
      onPress: handleCheckUpdate,
      showUpdateDot: hasUpdate,
      value: `v${CURRENT_VERSION}`,
    },
  ];

  const displayName = profile?.name ?? 'Guest';

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}>
      <View style={[styles.header, {paddingTop: spacing.xl + 20}]}>
        <View style={styles.headerBgWrap}>
          <Image
            source={require('@/assets/login/bg.png')}
            style={styles.headerBg}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
        </View>
        <Text style={[styles.headerTitle, typography.body1]}>我的</Text>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>
            {String(displayName).slice(0, 1).toUpperCase()}
          </Text>
        </View>
        {isLoggedIn ? (
          <Text style={styles.userName}>{displayName}</Text>
        ) : (
          <Text style={styles.loginTip}>未登录</Text>
        )}
      </View>

      <View
        style={[
          styles.menuSection,
          {
            backgroundColor: colors.surface,
            borderTopLeftRadius: borderRadius.lg,
            borderTopRightRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
          },
        ]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.menuItem,
              {
                paddingVertical: spacing.md + 2,
                borderBottomColor: colors.border,
              },
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}>
            <View style={[styles.menuIcon, {marginRight: spacing.md}]}>
              <Icon name={item.icon as any} size={18} color="#0C68F2" />
            </View>
            <Text
              style={[
                styles.menuTitle,
                typography.body1,
                {color: colors.text},
              ]}>
              {item.title}
            </Text>
            <View style={styles.menuRight}>
              {item.showUpdateDot ? <View style={styles.updateDot} /> : null}
              {item.value ? (
                <Text
                  style={[
                    styles.menuValue,
                    {color: colors.textSecondary, marginRight: spacing.xs},
                  ]}>
                  {item.value}
                </Text>
              ) : null}
              <Icon name="right" size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.logoutBtn,
          {
            marginTop: spacing.xl,
            marginHorizontal: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.7}>
        <Text style={[styles.logoutText, typography.body1]}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    position: 'relative',
    paddingBottom: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerBgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerBg: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  headerTitle: {
    color: '#FFFFFF',
    marginBottom: 16,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginTip: {
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  menuSection: {
    marginTop: -12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(12, 104, 242, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3434',
    marginRight: 8,
  },
  menuValue: {
    fontSize: 14,
  },
  logoutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  logoutText: {
    color: '#4A9FFF',
    fontWeight: '500',
  },
});
