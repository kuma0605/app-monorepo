import {useCallback} from 'react';
import {getLastAppVersion} from '@/services/baseService';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {setUpdateInfo, setIgnoredVersion} from '@/store/slices/appSlice';
import {compareVersions} from '@/utils/version';

const {version: CURRENT_VERSION} = require('../../package.json');

export function useAppUpdate() {
  const dispatch = useAppDispatch();
  const updateInfo = useAppSelector(state => state.app.updateInfo);

  const {hasUpdate, latestVersion, downloadUrl, forceUpdate, ignoredVersion} =
    updateInfo;

  const checkForUpdate = useCallback(
    async (isManual = false) => {
      try {
        const res = await getLastAppVersion(
          isManual ? undefined : {noLoading: true},
        );
        if (res.code === 200 && res.data) {
          const serverVersion = (res.data as any).code ?? '';
          const isForce = !!(res.data as any).forceUpdate; // 兼容后端未来可能加入的 forceUpdate 字段

          if (
            serverVersion &&
            compareVersions(serverVersion, `v${CURRENT_VERSION}`) > 0
          ) {
            // 有新版本
            dispatch(
              setUpdateInfo({
                hasUpdate: true,
                latestVersion: serverVersion,
                downloadUrl: res.data.downloadUrl ?? '',
                forceUpdate: isForce,
              }),
            );

            // 手动检查时，清除忽略标记，使得下次可强制弹出
            if (isManual) {
              dispatch(setIgnoredVersion(''));
            }

            return {
              hasUpdate: true,
              latestVersion: serverVersion,
              downloadUrl: res.data.downloadUrl ?? '',
            };
          } else {
            // 无新版本或服务端版本过旧
            dispatch(
              setUpdateInfo({
                hasUpdate: false,
                forceUpdate: false,
              }),
            );
            return {hasUpdate: false};
          }
        }
        return {hasUpdate: false};
      } catch (err) {
        if (isManual) {
          throw err;
        }
        return {hasUpdate: false};
      }
    },
    [dispatch],
  );

  const dismissUpdate = useCallback(() => {
    if (latestVersion) {
      dispatch(setIgnoredVersion(latestVersion));
    }
  }, [dispatch, latestVersion]);

  return {
    hasUpdate,
    latestVersion,
    downloadUrl,
    forceUpdate,
    ignoredVersion,
    checkForUpdate,
    dismissUpdate,
  };
}
