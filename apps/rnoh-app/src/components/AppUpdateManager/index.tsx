import React, {useEffect, useCallback} from 'react';
import {Linking} from 'react-native';
import {useAppUpdate} from '@/hooks/useAppUpdate';
import UpdateModal from '../UpdateModal';

export function AppUpdateManager() {
  const {
    hasUpdate,
    latestVersion,
    downloadUrl,
    forceUpdate,
    ignoredVersion,
    checkForUpdate,
    dismissUpdate,
  } = useAppUpdate();

  // App 启动时执行一次静默版本检查
  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  const handleConfirm = useCallback(() => {
    // 如果不是强制更新，点击立即更新也可以认为用户已经知晓并处理了更新弹窗
    if (!forceUpdate) {
      dismissUpdate();
    }
    if (downloadUrl) {
      Linking.openURL(downloadUrl);
    }
  }, [forceUpdate, dismissUpdate, downloadUrl]);

  // 显示条件：有更新，且（属于强制更新 或 该版本未被忽略）
  const isVisible =
    hasUpdate && (forceUpdate || latestVersion !== ignoredVersion);

  return (
    <UpdateModal
      visible={isVisible}
      latestVersion={latestVersion}
      onClose={dismissUpdate}
      onConfirm={handleConfirm}
      forceUpdate={forceUpdate}
    />
  );
}
