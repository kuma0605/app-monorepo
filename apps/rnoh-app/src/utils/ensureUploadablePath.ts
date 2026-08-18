import {Platform} from 'react-native';
import type {DocumentPickerResponse} from 'react-native-document-picker';
import RNFS from 'react-native-fs';

/**
 * 推断 RNFS 兜底复制时的临时文件扩展名。
 * 优先 picked.name，其次 MIME 子类型（如 image/png → png）；不影响 FormData 的 type / name。
 */
function getUploadExtension(picked: DocumentPickerResponse): string {
  const fromName = picked.name?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  const mime = picked.type?.toLowerCase();
  if (!mime) {
    return 'bin';
  }

  const subtype = mime.split('/').pop()?.split('+')[0];
  if (
    subtype &&
    subtype !== 'octet-stream' &&
    /^[a-z0-9]{1,16}$/.test(subtype)
  ) {
    return subtype;
  }

  return 'bin';
}

function buildCopySourceCandidates(picked: DocumentPickerResponse): string[] {
  const candidates: string[] = [];
  const push = (value?: string | null) => {
    if (value && !candidates.includes(value)) {
      candidates.push(value);
    }
  };

  push(picked.uri);
  if (picked.uri) {
    try {
      push(decodeURIComponent(picked.uri));
    } catch {
      // ignore malformed escape sequences
    }
  }

  return candidates;
}

async function copyPickedFileToSandbox(
  picked: DocumentPickerResponse,
  destPath: string,
): Promise<void> {
  const sources = buildCopySourceCandidates(picked);
  const errors: string[] = [];

  for (const source of sources) {
    try {
      await RNFS.copyFile(source, destPath);
      if (await RNFS.exists(destPath)) {
        return;
      }
    } catch (err) {
      errors.push(
        `copyFile(${source}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  if (Platform.OS === 'harmony') {
    for (const source of sources) {
      try {
        const base64 = await RNFS.readFile(source, 'base64');
        await RNFS.writeFile(destPath, base64, 'base64');
        if (await RNFS.exists(destPath)) {
          return;
        }
      } catch (err) {
        errors.push(
          `read/write(${source}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  const copyError = picked.copyError
    ? ` picker.copyError=${picked.copyError}`
    : '';
  throw new Error(
    `无法复制文件到沙箱以供上传：${errors.join(' | ')}${copyError}`,
  );
}

export type EnsureUploadablePathResult = {
  path: string;
  source: 'fileCopyUri' | 'rnfs-copy';
};

/**
 * 解析上传可用的沙箱路径。
 * 优先 fileCopyUri；若 DocumentPicker copyTo 失败（如鸿蒙相册图 copyError），
 * 用 RNFS 从 picker uri 再复制到 DocumentDirectory。
 */
export async function ensureUploadablePath(
  picked: DocumentPickerResponse,
): Promise<EnsureUploadablePathResult> {
  if (picked.fileCopyUri) {
    return {path: picked.fileCopyUri, source: 'fileCopyUri'};
  }

  if (!picked.uri) {
    throw new Error('未获取到可读取的文件 uri');
  }

  const destPath = `${
    RNFS.DocumentDirectoryPath
  }/upload_${Date.now()}.${getUploadExtension(picked)}`;

  await copyPickedFileToSandbox(picked, destPath);

  return {path: destPath, source: 'rnfs-copy'};
}
