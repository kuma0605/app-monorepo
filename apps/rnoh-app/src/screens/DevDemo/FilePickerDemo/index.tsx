import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import {pickSingle, types} from 'react-native-document-picker';
import type {DocumentPickerResponse} from 'react-native-document-picker';
import FileViewer from 'react-native-file-viewer';

import {dictateFeedBack} from '@/services/baseService';
import {buildUploadFormDataFromPickedFile} from '@/utils/buildUploadFormDataFromPickedFile';
import {resolvePreviewTarget} from '@/utils/openPickedFilePreview';

const COMPRESSED_EXTS = new Set([
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'tgz',
  'bz2',
  'xz',
]);

function getExt(name?: string | null): string {
  if (!name) {
    return '';
  }
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function isCompressedFile(name?: string | null): boolean {
  return COMPRESSED_EXTS.has(getExt(name));
}

function showTip(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('提示', msg);
  }
}

export default function FilePickerDemo() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [picked, setPicked] = useState<DocumentPickerResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = useCallback(async () => {
    try {
      const file = await pickSingle({
        type: [types.allFiles],
        copyTo: 'documentDirectory',
        allowMultiSelection: false,
      });

      setPicked(file);
      setFileName(file.name ?? '未知文件');
      setUploadResult(null);
      setUploadedUrl(null);

      setIsUploading(true);
      const formData = await buildUploadFormDataFromPickedFile(file);
      const res = await dictateFeedBack(formData);

      if (res.success) {
        setUploadResult(JSON.stringify(res.data, null, 2));
        // 提取服务端返回的文件访问地址
        const url =
          typeof res.data === 'string'
            ? res.data
            : res.data?.url ?? res.data?.fileUrl ?? res.data?.path ?? null;
        setUploadedUrl(url);
        showTip('上传成功');
      } else {
        setUploadResult(`上传失败: ${res.message}`);
        showTip(`上传失败: ${res.message}`);
      }
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'isCancel' in err &&
        (err as any).isCancel
      ) {
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setUploadResult(`错误: ${msg}`);
      showTip(msg);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const previewFile = useCallback(async () => {
    if (!picked) {
      return;
    }

    if (isCompressedFile(picked.name)) {
      if (!uploadedUrl) {
        showTip('请先上传文件');
        return;
      }
      Linking.openURL(uploadedUrl).catch(() => {
        showTip('无法打开系统浏览器');
      });
      return;
    }

    try {
      const {filePath, openOptions} = resolvePreviewTarget(picked);
      await FileViewer.open(filePath, openOptions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showTip(`预览失败: ${msg}`);
    }
  }, [picked, uploadedUrl]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pickBtn, isUploading && styles.pickBtnDisabled]}
        onPress={pickAndUpload}
        disabled={isUploading}
        activeOpacity={0.75}>
        {isUploading ? (
          <ActivityIndicator color="#fff" size="small" style={styles.spinner} />
        ) : null}
        <Text style={styles.pickBtnText}>选择文件并上传</Text>
      </TouchableOpacity>

      {fileName && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{fileName}</Text>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={previewFile}
            activeOpacity={0.75}>
            <Text style={styles.previewBtnText}>预览</Text>
          </TouchableOpacity>
        </View>
      )}

      {uploadResult && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>上传结果</Text>
          <Text style={styles.resultText}>{uploadResult}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  pickBtnDisabled: {
    opacity: 0.45,
  },
  spinner: {
    marginRight: 8,
  },
  pickBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfo: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8e8e8',
  },
  fileName: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  previewBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  previewBtnText: {
    fontSize: 14,
    color: '#1677ff',
    fontWeight: '500',
  },
  resultSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8e8e8',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
