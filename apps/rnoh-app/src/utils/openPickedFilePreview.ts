import {Platform} from 'react-native';
import DocumentPicker, {
  isCancel,
  types,
  type DocumentPickerResponse,
} from 'react-native-document-picker';
import FileViewer from 'react-native-file-viewer';

export type FileViewerOpenOptions = NonNullable<
  Parameters<typeof FileViewer.open>[1]
>;

export type PickedFileOpenStrategy =
  | 'harmony-sandbox-preview'
  | 'harmony-picker-uri'
  | 'sandbox-preview'
  | 'direct';

export type OpenPickedFileResult = {
  picked: DocumentPickerResponse;
  filePath: string;
  openOptions: FileViewerOpenOptions | string | undefined;
  strategy: PickedFileOpenStrategy;
  statusLines: string[];
};

export function resolvePickedPath(
  picked: Pick<DocumentPickerResponse, 'uri' | 'fileCopyUri'>,
): string {
  return picked.fileCopyUri ?? picked.uri;
}

function normalizeUserOptions(
  userOptions?: FileViewerOpenOptions | string,
): FileViewerOpenOptions {
  if (typeof userOptions === 'string') {
    return {displayName: userOptions};
  }
  return userOptions ?? {};
}

function withDefaultDisplayName(
  options: FileViewerOpenOptions,
  picked: DocumentPickerResponse,
): FileViewerOpenOptions {
  if (options.displayName) {
    return options;
  }
  return picked.name ? {...options, displayName: picked.name} : options;
}

function stripSystemOpenFlags(
  options: FileViewerOpenOptions,
): FileViewerOpenOptions {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit flags for PreviewKit
  const {showOpenWithDialog, showAppsSuggestions, ...rest} = options;
  return rest;
}

/**
 * Harmony 预览策略（需配合原生 patch，见 docs/file-viewer/鸿蒙集成与修复说明.md）：
 * 1. 有 fileCopyUri → 沙箱 ASCII 文件名 + PreviewKit
 * 2. 否则 → picker 原始 uri（file://docs/...）+ showOpenWithDialog
 */
export function resolveHarmonyPreviewTarget(
  picked: DocumentPickerResponse,
  userOptions?: FileViewerOpenOptions | string,
): {
  filePath: string;
  openOptions: FileViewerOpenOptions;
  strategy: PickedFileOpenStrategy;
} {
  const options = withDefaultDisplayName(
    normalizeUserOptions(userOptions),
    picked,
  );

  if (options.showAppsSuggestions) {
    return {
      filePath: picked.uri,
      openOptions: options,
      strategy: 'harmony-picker-uri',
    };
  }

  if (picked.fileCopyUri) {
    return {
      filePath: picked.fileCopyUri,
      openOptions: stripSystemOpenFlags(options),
      strategy: 'harmony-sandbox-preview',
    };
  }

  return {
    filePath: picked.uri,
    openOptions: {
      ...options,
      showOpenWithDialog: true,
    },
    strategy: 'harmony-picker-uri',
  };
}

export function resolvePreviewTarget(
  picked: DocumentPickerResponse,
  userOptions?: FileViewerOpenOptions | string,
): {
  filePath: string;
  openOptions: FileViewerOpenOptions | string | undefined;
  strategy: PickedFileOpenStrategy;
} {
  if (Platform.OS === 'harmony') {
    return resolveHarmonyPreviewTarget(picked, userOptions);
  }

  return {
    filePath: resolvePickedPath(picked),
    openOptions: withDefaultDisplayName(
      normalizeUserOptions(userOptions),
      picked,
    ),
    strategy: picked.fileCopyUri ? 'sandbox-preview' : 'direct',
  };
}

export function buildPickedFileStatusLines(
  picked: DocumentPickerResponse,
  filePath: string,
  openOptions: FileViewerOpenOptions | string | undefined,
  strategy: PickedFileOpenStrategy,
): string[] {
  const lines = [
    '已调用 FileViewer.open',
    `strategy=${strategy}`,
    `name=${picked.name ?? '(unknown)'}`,
    `uri=${picked.uri}`,
    `fileCopyUri=${picked.fileCopyUri ?? '(null)'}`,
    `openPath=${filePath}`,
    `option=${JSON.stringify(openOptions ?? null)}`,
  ];

  if (picked.copyError) {
    lines.push(`copyError=${picked.copyError}`);
  }

  if (strategy === 'harmony-sandbox-preview') {
    lines.push('Harmony: 沙箱 picked.{ext} + PreviewKit');
  } else if (strategy === 'harmony-picker-uri') {
    lines.push('Harmony: picker 原始 uri + showOpenWithDialog');
  } else if (picked.fileCopyUri) {
    lines.push('使用沙箱副本打开');
  }

  return lines;
}

export async function openPickedFilePreview(
  userOptions?: FileViewerOpenOptions | string,
): Promise<OpenPickedFileResult> {
  const res = await DocumentPicker.pick({
    type: [types.allFiles],
    copyTo: 'documentDirectory',
    allowMultiSelection: false,
  });
  const picked = res[0];
  const {filePath, openOptions, strategy} = resolvePreviewTarget(
    picked,
    userOptions,
  );

  await FileViewer.open(filePath, openOptions);

  const statusLines = buildPickedFileStatusLines(
    picked,
    filePath,
    openOptions,
    strategy,
  );

  return {
    picked,
    filePath,
    openOptions,
    strategy,
    statusLines,
  };
}

export {isCancel};
