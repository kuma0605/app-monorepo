import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

import {store} from '@/store';
import {setLoading} from '@/store/slices/globalSlice';

import type {FileViewerOpenOptions} from './openPickedFilePreview';

export type DownloadAndOpenOptions = {
  /** 覆盖从 URL 解析的文件名 */
  fileName?: string;
  /** 传给 FileViewer.open 的选项（含 displayName） */
  fileViewerOptions?: FileViewerOpenOptions;
  /** 为 true 时 dispatch 全局 LoadingOverlay */
  useGlobalLoading?: boolean;
  /** 本地 loading 回调，例如按钮 state */
  onLoadingChange?: (loading: boolean) => void;
};

export type DownloadAndOpenResult = {
  localFile: string;
  fileName: string;
};

function getUrlExtension(url: string): string {
  return url.split(/[#?]/)[0].split('.').pop()?.trim() ?? 'bin';
}

function getDownloadFileName(url: string): string {
  const pathPart = url.split(/[#?]/)[0];
  const baseName = pathPart.split('/').pop()?.trim();
  if (baseName && baseName.includes('.')) {
    return baseName;
  }
  return `temporaryfile.${getUrlExtension(url)}`;
}

function notifyLoading(
  loading: boolean,
  options?: DownloadAndOpenOptions,
): void {
  options?.onLoadingChange?.(loading);
  if (options?.useGlobalLoading) {
    store.dispatch(setLoading(loading));
  }
}

/**
 * 下载远程文件到 DocumentDirectory 并用 FileViewer 打开。
 * 见 docs/file-viewer/react-native-file-viewer.md「Download and open a file locally」。
 */
export async function downloadAndOpenFile(
  url: string,
  options?: DownloadAndOpenOptions,
): Promise<DownloadAndOpenResult> {
  const fileName = options?.fileName ?? getDownloadFileName(url);
  const localFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;

  try {
    notifyLoading(true, options);
    await RNFS.downloadFile({
      fromUrl: url,
      toFile: localFile,
    }).promise;
    await FileViewer.open(localFile, {
      displayName: fileName,
      ...options?.fileViewerOptions,
    });
    return {localFile, fileName};
  } finally {
    notifyLoading(false, options);
  }
}
