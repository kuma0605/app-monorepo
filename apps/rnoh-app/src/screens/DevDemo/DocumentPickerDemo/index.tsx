import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Switch,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import {
  isCancel,
  pick,
  types,
  pickDirectory,
  pickSingle,
  DocumentPickerOptions,
  type DocumentPickerResponse,
} from 'react-native-document-picker';

import {dictateFeedBack} from '@/services/baseService';
import {buildUploadFormDataFromPickedFile} from '@/utils/buildUploadFormDataFromPickedFile';

function showTip(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('提示', msg);
  }
}

const typeList = Object.keys(types);

interface MultiSelectProps {
  onSelectValue?: (val: string[]) => void;
}

interface UiSelItem {
  label: keyof typeof types;
  selected: boolean;
  index: number;
}

type DirType = 'documentDirectory' | 'cachesDirectory';

interface DirOpt {
  label: DirType;
  selected: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({onSelectValue}) => {
  const [typeUi, setTypeUi] = useState<UiSelItem[]>(
    typeList.map((val, index) => ({
      label: val as keyof typeof types,
      selected: false,
      index,
    })),
  );

  const onClickSelLabel = (val: (typeof typeUi)[0]) => {
    // 选择allfile不行选择其它的
    if (
      typeUi.find(t => t.label === 'allFiles')?.selected &&
      val.label !== 'allFiles'
    ) {
      return;
    }
    let newList = [];
    if (val.label === 'allFiles') {
      newList = typeUi.map(s => {
        return s.label === 'allFiles'
          ? {...s, selected: !s.selected}
          : {...s, selected: false};
      });
    } else {
      newList = typeUi.map(s => {
        return val.index === s.index ? {...s, selected: !s.selected} : {...s};
      });
    }
    const extList = newList
      .filter(t => t.selected)
      .map(t => types[t.label])
      .reduce((res, typeStr) => {
        res.push(...typeStr.split(' '));
        return res;
      }, [] as string[]);
    if (onSelectValue) {
      onSelectValue(extList);
    }
    setTypeUi(newList);
  };

  return (
    <>
      <View
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          rowGap: 14,
        }}>
        <View style={{width: '100%'}}>
          <Text style={{fontSize: 20, fontWeight: '600', margin: 6}}>
            picker 的文件类型
          </Text>
        </View>
        {typeUi.map((s: any) => (
          <TouchableOpacity
            key={s.label}
            onPress={() => {
              onClickSelLabel(s);
            }}>
            <View
              style={s.selected ? styles.selectBtnActive : styles.selectBtn}>
              <Text>{s.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

export default function DocumentPickerDemo(): JSX.Element {
  const [pickResult, setPickResult] = useState('');
  const [uploadResult, setUploadResult] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  // 是否允许多选
  const [allowMultiSelection, setAllowMultiSelection] = useState(true);
  // 选择文件类型
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  // copyTo 文件夹
  const [dirUi, setDirui] = useState<Array<DirOpt>>([
    {label: 'documentDirectory', selected: false},
    {label: 'cachesDirectory', selected: false},
  ]);

  const copyTo = dirUi.find(d => d.selected)?.label;

  const pickOpt: DocumentPickerOptions = useMemo(() => {
    const options: DocumentPickerOptions = {
      allowMultiSelection,
    };
    if (copyTo) {
      options.copyTo = copyTo;
    }
    if (fileTypes.length) {
      options.type = fileTypes;
    }
    return options;
  }, [allowMultiSelection, copyTo, fileTypes]);

  const onDirSelect = (val: DirOpt) => {
    const newUiList = dirUi.map(d => {
      if (val.label === d.label) {
        return {...d, selected: !d.selected};
      } else {
        return {...d, selected: false};
      }
    });
    setDirui(newUiList);
  };

  const pickFile = async () => {
    try {
      const res = await pick(pickOpt);
      setPickResult(JSON.stringify(res));
    } catch (err) {
      console.log(err);
    }
  };

  const pickS = async () => {
    try {
      const res = await pickSingle(pickOpt);
      setPickResult(JSON.stringify(res));
    } catch (err) {
      console.log(err);
    }
  };

  const pickDir = async () => {
    const res = await pickDirectory();
    console.log(res);
  };

  const uploadPickedFiles = useCallback(
    async (pickedList: DocumentPickerResponse[]) => {
      if (!pickedList.length) {
        return;
      }

      setIsUploading(true);
      setUploadResult('上传中...');

      try {
        const responses = [];

        for (const picked of pickedList) {
          const formData = await buildUploadFormDataFromPickedFile(picked);
          const res = await dictateFeedBack(formData);

          if (!res.success) {
            throw new Error(res.message || '服务端处理失败');
          }

          responses.push({
            name: picked.name,
            success: res.success,
            code: res.code,
            message: res.message,
            data: res.data,
          });
        }

        setUploadResult(JSON.stringify(responses, null, 2));
        showTip(`上传完成（${responses.length} 个文件）`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setUploadResult(`上传失败: ${message}`);
        showTip(`上传失败: ${message}`);
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const pickAndUploadSingle = useCallback(async () => {
    try {
      const picked = await pickSingle({
        ...pickOpt,
        allowMultiSelection: false,
        copyTo: copyTo ?? 'documentDirectory',
      });
      setPickResult(JSON.stringify(picked, null, 2));
      await uploadPickedFiles([picked]);
    } catch (err) {
      if (isCancel(err)) {
        setUploadResult('已取消选择文件');
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      setUploadResult(`选择或上传失败: ${message}`);
      showTip(`选择或上传失败: ${message}`);
    }
  }, [copyTo, pickOpt, uploadPickedFiles]);

  const pickAndUploadMultiple = useCallback(async () => {
    try {
      const pickedList = await pick({
        ...pickOpt,
        allowMultiSelection: true,
        copyTo: copyTo ?? 'documentDirectory',
      });
      setPickResult(JSON.stringify(pickedList, null, 2));
      await uploadPickedFiles(pickedList);
    } catch (err) {
      if (isCancel(err)) {
        setUploadResult('已取消选择文件');
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      setUploadResult(`选择或上传失败: ${message}`);
      showTip(`选择或上传失败: ${message}`);
    }
  }, [copyTo, pickOpt, uploadPickedFiles]);

  return (
    <ScrollView>
      <Text>{JSON.stringify(pickOpt)}</Text>

      <MultiSelect onSelectValue={setFileTypes} />

      <View style={{width: '100%'}}>
        <Text style={{fontSize: 20, fontWeight: '600', margin: 6}}>
          是否多选
        </Text>
      </View>

      <Switch
        value={allowMultiSelection}
        onValueChange={setAllowMultiSelection}
      />

      <View style={{width: '100%'}}>
        <Text style={{fontSize: 20, fontWeight: '600', margin: 6}}>
          copyTo文件夹
        </Text>
      </View>

      <View
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          rowGap: 14,
        }}>
        {dirUi.map(s => (
          <TouchableOpacity
            key={s.label}
            onPress={() => {
              onDirSelect(s);
            }}>
            <View
              style={s.selected ? styles.selectBtnActive : styles.selectBtn}>
              <Text>{s.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={pickFile} style={styles.btn}>
        <Text style={styles.btnText}>pick file</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={pickS} style={styles.btn}>
        <Text style={styles.btnText}>pick file single</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={pickDir} style={styles.btn}>
        <Text style={styles.btnText}>pick Dir</Text>
      </TouchableOpacity>

      <View style={{width: '100%'}}>
        <Text style={{fontSize: 20, fontWeight: '600', margin: 6}}>
          选择并上传（示例）
        </Text>
        <Text style={styles.uploadHint}>
          流程：DocumentPicker 选文件 → ensureUploadablePath（无 fileCopyUri 时
          RNFS 复制到沙箱）→ buildUploadFormDataFromPickedFile →
          dictateFeedBack。建议 copyTo documentDirectory。
        </Text>
      </View>

      <TouchableOpacity
        disabled={isUploading}
        onPress={pickAndUploadSingle}
        style={[styles.btn, isUploading && styles.btnDisabled]}>
        {isUploading ? (
          <ActivityIndicator
            color="#fff"
            size="small"
            style={styles.btnSpinner}
          />
        ) : null}
        <Text style={styles.btnText}>选择单文件并上传</Text>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={isUploading}
        onPress={pickAndUploadMultiple}
        style={[styles.btn, isUploading && styles.btnDisabled]}>
        <Text style={styles.btnText}>选择多文件并上传</Text>
      </TouchableOpacity>

      <View style={{width: '100%'}}>
        <Text style={{fontSize: 20, fontWeight: '600', margin: 6}}>
          选择结果
        </Text>
      </View>
      <Text>{pickResult}</Text>

      <View style={{width: '100%'}}>
        <Text style={{fontSize: 20, fontWeight: '600', margin: 6}}>
          上传结果
        </Text>
      </View>
      <Text>{uploadResult}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  TextInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    width: '90%',
  },
  btn: {
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  btnText: {fontWeight: 'bold', color: '#fff', fontSize: 20},
  uploadHint: {
    fontSize: 13,
    color: '#333',
    marginHorizontal: 6,
    lineHeight: 18,
  },
  selectBtn: {
    padding: 8,
    margin: 3,
    fontSize: 18,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#753c13',
  },
  selectBtnActive: {
    padding: 8,
    margin: 3,
    backgroundColor: '#e2803b',
    fontSize: 18,
    borderRadius: 8,
    borderWidth: 1,
  },
});
