import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

import {downloadAndOpenFile} from '@/utils/downloadAndOpenFile';
import {
  isCancel,
  openPickedFilePreview,
  type FileViewerOpenOptions,
} from '@/utils/openPickedFilePreview';

/** 官方示例 PDF，见 docs/file-viewer/react-native-file-viewer.md */
const SAMPLE_PDF_URL =
  'https://github.com/vinzscam/react-native-file-viewer/raw/master/docs/react-native-file-viewer-certificate.pdf';

function showTip(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('提示', msg);
  }
}

export default function FileViewerDemo(): React.JSX.Element {
  const [status, setStatus] = useState('点击下方按钮选择本地文件并预览');
  const [isDownloading, setIsDownloading] = useState(false);

  const openPickedFile = useCallback(
    async (option?: FileViewerOpenOptions | string) => {
      try {
        const result = await openPickedFilePreview(option);
        setStatus(result.statusLines.join('\n'));
      } catch (err) {
        if (isCancel(err)) {
          setStatus('已取消选择文件');
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setStatus(`预览失败: ${message}`);
        showTip(`预览失败: ${message}`);
      }
    },
    [],
  );

  const onDismissCb = useCallback(() => {
    showTip('FileViewer onDismiss 回调已触发');
    setStatus(prev => `${prev}\n\nonDismiss 已触发`);
  }, []);

  const downloadAndOpenSample = useCallback(async () => {
    try {
      const {localFile, fileName} = await downloadAndOpenFile(SAMPLE_PDF_URL, {
        onLoadingChange: setIsDownloading,
      });
      setStatus(
        [
          '已下载并调用 FileViewer.open',
          `url=${SAMPLE_PDF_URL}`,
          `localFile=${localFile}`,
          `displayName=${fileName}`,
        ].join('\n'),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus(`下载或预览失败:\n${message}`);
      showTip(`下载或预览失败: ${message}`);
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>react-native-file-viewer</Text>
      <Text style={styles.hint}>
        Harmony 预览说明见 docs/file-viewer/鸿蒙集成与修复说明.md。有
        fileCopyUri 时走沙箱 PreviewKit，否则用 picker 原始 uri。
      </Text>
      <Text style={styles.status}>{status}</Text>

      <View style={styles.divider} />

      <Text style={styles.btnDesc}>
        不传选项。预览标题默认用原文件名（displayName=picked.name）；鸿蒙沙箱路径仍为
        picked.{'{ext}'}。要自定义标题请传 displayName。
      </Text>
      <TouchableOpacity onPress={() => openPickedFile()} style={styles.btn}>
        <Text style={styles.btnText}>选择文件并预览（默认）</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.btnDesc}>
        第二参数传字符串，等价于 {'{ displayName: "..." }'}
        ，仅改预览窗口标题，不改变打开方式。
      </Text>
      <TouchableOpacity
        onPress={() => openPickedFile('show_displayName string')}
        style={styles.btn}>
        <Text style={styles.btnText}>选择文件并预览（displayName 字符串）</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.btnDesc}>
        与上一种相同，只是用对象写法指定 displayName（官方两种写法对照）。
      </Text>
      <TouchableOpacity
        onPress={() => openPickedFile({displayName: 'show_displayName option'})}
        style={styles.btn}>
        <Text style={styles.btnText}>选择文件并预览（displayName 选项）</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.btnDesc}>
        强制「打开方式」并注册 onDismiss（关闭预览时 Toast/Alert）。Harmony
        有沙箱副本时仍会优先 PreviewKit，onDismiss 可能不触发。
      </Text>
      <TouchableOpacity
        onPress={() =>
          openPickedFile({
            showOpenWithDialog: true,
            onDismiss: onDismissCb,
          })
        }
        style={styles.btn}>
        <Text style={styles.btnText}>选择文件并预览（onDismiss）</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.btnDesc}>
        始终弹出系统「打开方式」选应用（Android 常用）。Harmony
        有沙箱副本时会被策略去掉，仍走 PreviewKit。
      </Text>
      <TouchableOpacity
        onPress={() => openPickedFile({showOpenWithDialog: true})}
        style={styles.btn}>
        <Text style={styles.btnText}>选择文件并预览（showOpenWithDialog）</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.btnDesc}>
        鸿蒙：跳转应用市场推荐可打开该类型的 App（用 picker 原始 uri）。Android
        行为依系统而定，一般也偏向应用选择/推荐。
      </Text>
      <TouchableOpacity
        onPress={() => openPickedFile({showAppsSuggestions: true})}
        style={styles.btn}>
        <Text style={styles.btnText}>
          选择文件并预览（showAppsSuggestions）
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>
        Download and open（react-native-fs）
      </Text>
      <Text style={styles.btnDesc}>
        按官方文档：RNFS.downloadFile 下载到 DocumentDirectory，再
        FileViewer.open。 扩展名须正确（示例为 PDF）。需网络权限。
      </Text>
      <TouchableOpacity
        disabled={isDownloading}
        onPress={downloadAndOpenSample}
        style={[styles.btn, isDownloading && styles.btnDisabled]}>
        {isDownloading ? (
          <ActivityIndicator
            color="#fff"
            size="small"
            style={styles.btnSpinner}
          />
        ) : null}
        <Text style={styles.btnText}>
          {isDownloading ? '下载中...' : '下载示例 PDF 并预览'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'skyblue',
    paddingBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    margin: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  status: {
    fontSize: 13,
    color: '#222',
    marginHorizontal: 16,
    marginBottom: 8,
    lineHeight: 18,
  },
  btnDesc: {
    fontSize: 13,
    color: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  btn: {
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
    padding: 10,
    margin: 10,
    backgroundColor: 'blue',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnSpinner: {
    marginRight: 8,
  },
  btnText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 20,
  },
});
