import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal as RNModal,
  Linking,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Form,
  Button,
  Radio,
  Picker,
  Input,
  Modal,
  Icon,
  Checkbox,
} from '@ant-design/react-native';
import dayjs from 'dayjs';
import {
  pick,
  types,
  isCancel,
  type DocumentPickerResponse,
} from 'react-native-document-picker';

import {useTheme} from '@/hooks/useTheme';
import {DetailSection} from '@/components/DetailSection';
import {Calendar} from 'rn-cross-calendar';
import {StickyNotice} from '@/components';
import {
  DaDropdownTreePicker,
  DaDropdownColTreePicker,
  type DropdownItem,
} from '@/components/DaDropdownPicker';
import {dictateFeedBack, getTreeByDeptInspection} from '@/services/baseService';
import {buildUploadFormDataFromPickedFile} from '@/utils/buildUploadFormDataFromPickedFile';
import {resolvePreviewTarget} from '@/utils/openPickedFilePreview';
import FileViewer from 'react-native-file-viewer';
import type {DevDemoStackParamList} from './demoNavigationTypes';

type Props = NativeStackScreenProps<DevDemoStackParamList, 'DevDemoFormDemo'>;

interface FormValues {
  subjectName?: string;
  inspectorName?: string;
  checkType?: string;
  isPassed?: string;
  checkDate?: string;
  feedback?: string;
  departments?: string;
  images?: string[];
  files?: string[];
  checkOptions?: string[];
  realDepartments?: string;
}

interface ImageItem {
  id: string;
  uri: string;
  status: 'uploading' | 'done' | 'error';
  name: string;
  fileObj: DocumentPickerResponse;
  fileId?: string;
  fileUrl?: string;
}

interface FileItem {
  id: string;
  uri: string;
  name: string;
  size?: number;
  status: 'uploading' | 'done' | 'error';
  fileObj: DocumentPickerResponse;
  fileId?: string;
}

const CHECK_TYPE_OPTIONS = [
  {label: '日常检查', value: '1'},
  {label: '双随机抽查', value: '2'},
  {label: '专项检查', value: '3'},
];

const CHECK_OPTIONS = [
  {label: '营业执照', value: 'license'},
  {label: '食品安全', value: 'food'},
  {label: '消防设施', value: 'fire'},
  {label: '从业健康证', value: 'health'},
];

const DEPARTMENTS_MOCK = [
  {
    label: '市场监督管理局',
    value: 'd1',
    children: [
      {
        label: '综合执法支队',
        value: 'd1-1',
        children: [
          {label: '一中队', value: 'd1-1-1'},
          {label: '二中队', value: 'd1-1-2'},
        ],
      },
      {label: '食品安全监管科', value: 'd1-2'},
    ],
  },
  {
    label: '卫生健康委员会',
    value: 'd2',
    children: [
      {
        label: '公共卫生监督所',
        value: 'd2-1',
        children: [{label: '监督一科', value: 'd2-1-1'}],
      },
    ],
  },
];

const INITIAL_FORM: FormValues = {
  isPassed: '1',
};

export default function DevDemoFormDemoScreen({}: Props) {
  const {colors} = useTheme();
  const [form] = Form.useForm<FormValues>();

  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [checkTypeName, setCheckTypeName] = useState('');

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [tempDate, setTempDate] = useState<string | undefined>();
  const [panelDate, setPanelDate] = useState<string | undefined>();
  const calendarRef = useRef<any>(null);
  const checkDate = Form.useWatch('checkDate', form);
  const feedbackValue = Form.useWatch('feedback', form) || '';

  const [deptPickerVisible, setDeptPickerVisible] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState<
    DropdownItem | DropdownItem[] | null
  >(null);
  const [deptNames, setDeptNames] = useState('');

  const handleCalendarConfirm = useCallback(() => {
    if (!tempDate) {
      calendarRef.current?.shakeToday();
      return;
    }
    form.setFieldsValue({checkDate: tempDate});
    setCalendarVisible(false);
  }, [tempDate, form]);

  const handleDeptConfirm = (item: DropdownItem | DropdownItem[]) => {
    const list = Array.isArray(item) ? item : [item];
    const unique = list.filter(
      (el, index, arr) =>
        arr.findIndex(e => String(e.value) === String(el.value)) === index,
    );
    setSelectedDepts(unique.length ? unique : null);
    const names = unique.map(i => i.label).join(', ');
    const ids = unique.map(i => i.value).join(',');
    setDeptNames(names);
    form.setFieldsValue({departments: ids});
  };

  const [realDeptPickerVisible, setRealDeptPickerVisible] = useState(false);
  const [selectedRealDepts, setSelectedRealDepts] = useState<
    DropdownItem | DropdownItem[] | null
  >(null);
  const [realDeptNames, setRealDeptNames] = useState('');
  const [realDeptData, setRealDeptData] = useState<any[]>([]);

  useEffect(() => {
    const fetchRealDepts = async () => {
      try {
        const res = await getTreeByDeptInspection();
        if (res.code === 200 && res.data) {
          setRealDeptData(res.data);
        }
      } catch (err) {
        console.log('加载真实部门树失败:', err);
      }
    };
    fetchRealDepts();
  }, []);

  const handleRealDeptConfirm = (item: DropdownItem | DropdownItem[]) => {
    const list = Array.isArray(item) ? item : [item];
    const unique = list.filter(
      (el, index, arr) =>
        arr.findIndex(e => String(e.value) === String(el.value)) === index,
    );
    setSelectedRealDepts(unique.length ? unique : null);
    const names = unique.map(i => i.label).join(', ');
    const ids = unique.map(i => i.value).join(',');
    setRealDeptNames(names);
    form.setFieldsValue({realDepartments: ids});
  };

  const [images, setImages] = useState<ImageItem[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState('');

  const [files, setFiles] = useState<FileItem[]>([]);

  const uploadSingleFile = useCallback(
    async (item: FileItem) => {
      try {
        const formData = await buildUploadFormDataFromPickedFile(item.fileObj);
        const res = await dictateFeedBack(formData);
        if (res.code === 200 && res.data) {
          const fileUrl =
            typeof res.data === 'string'
              ? res.data
              : res.data?.url ?? res.data?.fileUrl ?? res.data?.path ?? '';
          const fileId =
            typeof res.data === 'object' && res.data !== null
              ? String(res.data?.fileId ?? res.data?.id ?? '')
              : '';

          setFiles(prev => {
            const updated = prev.map(f => {
              if (f.id === item.id) {
                return {
                  ...f,
                  status: 'done' as const,
                  fileId: fileId || fileUrl,
                  fileUrl: fileUrl,
                };
              }
              return f;
            });
            const doneUrls = updated
              .filter(f => f.status === 'done')
              .map(f => f.fileUrl || '');
            form.setFieldsValue({files: doneUrls});
            return updated;
          });
        } else {
          throw new Error(res.message || '上传接口返回错误');
        }
      } catch (err) {
        setFiles(prev =>
          prev.map(f => {
            if (f.id === item.id) {
              return {
                ...f,
                status: 'error' as const,
              };
            }
            return f;
          }),
        );
      }
    },
    [form],
  );

  const handlePickFiles = useCallback(async () => {
    try {
      const results = await pick({
        type: [types.allFiles],
        copyTo: 'documentDirectory',
        allowMultiSelection: true,
      });

      if (files.length + results.length > 9) {
        Alert.alert('提示', '最多只能上传 9 个文件');
        return;
      }

      const newItems: FileItem[] = results.map(file => {
        const uniqueId = `${file.uri}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        return {
          id: uniqueId,
          uri: file.uri,
          name: file.name || 'file',
          size: file.size ?? undefined,
          status: 'uploading' as const,
          fileObj: file,
        };
      });

      setFiles(prev => {
        const updated = [...prev, ...newItems];
        newItems.forEach(item => {
          uploadSingleFile(item);
        });
        return updated;
      });
    } catch (err) {
      if (isCancel(err)) {
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('选择失败', msg);
    }
  }, [files.length, uploadSingleFile]);

  const handleDeleteFile = useCallback(
    (id: string) => {
      setFiles(prev => {
        const updated = prev.filter(f => f.id !== id);
        const doneUrls = updated
          .filter(f => f.status === 'done')
          .map(f => f.fileUrl || '');
        form.setFieldsValue({
          files: doneUrls.length > 0 ? doneUrls : undefined,
        });
        return updated;
      });
    },
    [form],
  );

  const handleRetryFile = useCallback(
    (item: FileItem) => {
      setFiles(prev =>
        prev.map(f =>
          f.id === item.id ? {...f, status: 'uploading' as const} : f,
        ),
      );
      uploadSingleFile(item);
    },
    [uploadSingleFile],
  );

  const uploadSingleImage = useCallback(
    async (item: ImageItem) => {
      try {
        const formData = await buildUploadFormDataFromPickedFile(item.fileObj);
        const res = await dictateFeedBack(formData);
        if (res.code === 200 && res.data) {
          const fileUrl =
            typeof res.data === 'string'
              ? res.data
              : res.data?.url ?? res.data?.fileUrl ?? res.data?.path ?? '';
          const fileId =
            typeof res.data === 'object' && res.data !== null
              ? String(res.data?.fileId ?? res.data?.id ?? '')
              : '';

          setImages(prev => {
            const updated = prev.map(img => {
              if (img.id === item.id) {
                return {
                  ...img,
                  status: 'done' as const,
                  fileId: fileId || fileUrl,
                  fileUrl: fileUrl,
                };
              }
              return img;
            });
            const doneUrls = updated
              .filter(img => img.status === 'done')
              .map(img => img.fileUrl || '');
            form.setFieldsValue({images: doneUrls});
            return updated;
          });
        } else {
          throw new Error(res.message || '上传接口返回错误');
        }
      } catch (err) {
        setImages(prev =>
          prev.map(img => {
            if (img.id === item.id) {
              return {
                ...img,
                status: 'error' as const,
              };
            }
            return img;
          }),
        );
      }
    },
    [form],
  );

  const handlePickImages = useCallback(async () => {
    try {
      const results = await pick({
        type: [types.images],
        copyTo: 'documentDirectory',
        allowMultiSelection: true,
      });

      if (images.length + results.length > 9) {
        Alert.alert('提示', '最多只能上传 9 张图片');
        return;
      }

      const newItems: ImageItem[] = results.map(file => {
        const uniqueId = `${file.uri}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        return {
          id: uniqueId,
          uri: file.uri,
          status: 'uploading' as const,
          name: file.name || 'image.jpg',
          fileObj: file,
        };
      });

      setImages(prev => {
        const updated = [...prev, ...newItems];
        newItems.forEach(item => {
          uploadSingleImage(item);
        });
        return updated;
      });
    } catch (err) {
      if (isCancel(err)) {
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('选择失败', msg);
    }
  }, [images.length, uploadSingleImage]);

  const handleDeleteImage = useCallback(
    (id: string) => {
      setImages(prev => {
        const updated = prev.filter(img => img.id !== id);
        const doneUrls = updated
          .filter(img => img.status === 'done')
          .map(img => img.fileUrl || '');
        form.setFieldsValue({
          images: doneUrls.length > 0 ? doneUrls : undefined,
        });
        return updated;
      });
    },
    [form],
  );

  const handleRetryImage = useCallback(
    (item: ImageItem) => {
      setImages(prev =>
        prev.map(img =>
          img.id === item.id ? {...img, status: 'uploading' as const} : img,
        ),
      );
      uploadSingleImage(item);
    },
    [uploadSingleImage],
  );

  const handlePreview = useCallback((uri: string) => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  }, []);

  const handlePreviewFile = useCallback(async (item: FileItem) => {
    const ext = item.name.split('.').pop()?.toLowerCase();
    const isCompressed = ext
      ? ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
      : false;

    if (Platform.OS === 'harmony' && isCompressed) {
      if (item.fileUrl) {
        Linking.openURL(encodeURI(item.fileUrl)).catch(linkErr => {
          Alert.alert(
            '错误',
            '无法在浏览器中打开链接: ' + (linkErr?.message || String(linkErr)),
          );
        });
      } else {
        Alert.alert('提示', '未找到压缩文件的下载链接');
      }
      return;
    }

    const {filePath, openOptions} = resolvePreviewTarget(item.fileObj);
    try {
      await FileViewer.open(filePath, openOptions);
    } catch (err) {
      if (isCompressed) {
        if (item.fileUrl) {
          Linking.openURL(encodeURI(item.fileUrl)).catch(linkErr => {
            Alert.alert(
              '错误',
              '无法在浏览器中打开链接: ' +
                (linkErr?.message || String(linkErr)),
            );
          });
        } else {
          Alert.alert('提示', '未找到压缩文件的下载链接');
        }
      } else {
        Alert.alert('提示', '系统不支持预览此类型的文件');
      }
    }
  }, []);

  const watchOptions = Form.useWatch('checkOptions', form);
  const selectedOptions = useMemo(() => watchOptions || [], [watchOptions]);

  const handleCheckboxGroupChange = useCallback(
    (value: string, checked: boolean) => {
      let nextValue = [...selectedOptions];
      if (checked) {
        if (!nextValue.includes(value)) {
          nextValue.push(value);
        }
      } else {
        nextValue = nextValue.filter(v => v !== value);
      }
      form.setFieldsValue({checkOptions: nextValue});
    },
    [selectedOptions, form],
  );

  const handleSubmit = async () => {
    try {
      // 1. 校验常规表单字段
      const values = await form.validateFields();

      // 2. 校验照片附件是否已上传（必传）
      const doneImages = images.filter(img => img.status === 'done');
      if (doneImages.length === 0) {
        Alert.alert('提示', '请上传照片附件');
        return;
      }

      // 3. 拦截照片上传中的状态
      const uploadingImages = images.filter(img => img.status === 'uploading');
      if (uploadingImages.length > 0) {
        Alert.alert('提示', '有照片仍在上传中，请稍候提交');
        return;
      }

      // 4. 拦截文件上传中的状态
      const uploadingFiles = files.filter(f => f.status === 'uploading');
      if (uploadingFiles.length > 0) {
        Alert.alert('提示', '有文件附件仍在上传中，请稍候提交');
        return;
      }

      // 5. 提示存在上传失败的附件
      const errorImages = images.filter(img => img.status === 'error');
      const errorFiles = files.filter(f => f.status === 'error');
      if (errorImages.length > 0 || errorFiles.length > 0) {
        Alert.alert('提示', '存在上传失败的附件，请处理或删除后再提交');
        return;
      }

      Alert.alert('提交成功', JSON.stringify(values, null, 2));
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      Alert.alert('错误', error?.message || '表单校验失败');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
      style={[styles.container, {backgroundColor: colors.background}]}>
      <StickyNotice />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Form form={form} initialValues={INITIAL_FORM}>
          <DetailSection title="基础信息">
            <Form.Item
              name="subjectName"
              label="主体名称"
              labelStyle={styles.formLabel}
              normalize={v => v?.trim()}
              rules={[{required: true, message: '请输入主体名称'}]}>
              <Input
                placeholder="请输入被检查主体名称"
                inputStyle={styles.formInput}
              />
            </Form.Item>

            <Form.Item
              name="inspectorName"
              label="检查人员"
              labelStyle={styles.formLabel}
              normalize={v => v?.trim()}
              rules={[{required: true, message: '请输入检查人员姓名'}]}>
              <Input
                placeholder="请输入检查人员姓名"
                inputStyle={styles.formInput}
              />
            </Form.Item>

            <Form.Item
              name="checkType"
              rules={[{required: true, message: '请选择检查类型'}]}
              onPress={() => setTypePickerVisible(true)}>
              <View style={styles.customFormItemRow}>
                <View style={styles.customLabelContainer}>
                  <Text style={styles.asterisk}>*</Text>
                  <Text style={styles.formLabel}>检查类型</Text>
                </View>
                <View style={styles.customValueContainer}>
                  <Text
                    style={[
                      styles.formInputText,
                      checkTypeName ? styles.formInputFilled : null,
                    ]}
                    numberOfLines={1}>
                    {checkTypeName || '请选择检查类型'}
                  </Text>
                  {checkTypeName ? (
                    <TouchableOpacity
                      onPress={() => {
                        form.setFieldsValue({checkType: undefined});
                        setCheckTypeName('');
                      }}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                      <Icon
                        name="close-circle"
                        size={16}
                        color="#ccc"
                        style={styles.iconMargin}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Icon
                      name="right"
                      size={15}
                      color="#ccc"
                      style={styles.iconMargin}
                    />
                  )}
                </View>
              </View>
            </Form.Item>
          </DetailSection>

          <DetailSection title="检查明细">
            <Form.Item
              name="checkDate"
              rules={[{required: true, message: '请选择检查日期'}]}
              onPress={() => {
                const dateStr = form.getFieldValue('checkDate') || undefined;
                setTempDate(dateStr);
                setPanelDate(dateStr ?? dayjs().format('YYYY-MM-DD'));
                setCalendarVisible(true);
              }}>
              <View style={styles.customFormItemRow}>
                <View style={styles.customLabelContainer}>
                  <Text style={styles.asterisk}>*</Text>
                  <Text style={styles.formLabel}>检查日期</Text>
                </View>
                <View style={styles.customValueContainer}>
                  <Text
                    style={[
                      styles.formInputText,
                      checkDate ? styles.formInputFilled : null,
                    ]}
                    numberOfLines={1}>
                    {checkDate || '请选择日期'}
                  </Text>
                  {checkDate ? (
                    <TouchableOpacity
                      onPress={() => {
                        form.setFieldsValue({checkDate: undefined});
                      }}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                      <Icon
                        name="close-circle"
                        size={16}
                        color="#ccc"
                        style={styles.iconMargin}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Icon
                      name="right"
                      size={15}
                      color="#ccc"
                      style={styles.iconMargin}
                    />
                  )}
                </View>
              </View>
            </Form.Item>

            <Form.Item
              name="departments"
              onPress={() => setDeptPickerVisible(true)}>
              <View style={styles.customFormItemCol}>
                <View style={styles.customFormItemRow}>
                  <View style={styles.customLabelContainer}>
                    <Text style={styles.formLabel}>联合部门</Text>
                  </View>
                  <View style={styles.customValueContainer}>
                    {!deptNames ? (
                      <Text style={styles.formInputText}>请选择(多选)</Text>
                    ) : null}
                    {deptNames ? (
                      <TouchableOpacity
                        onPress={() => {
                          form.setFieldsValue({departments: undefined});
                          setDeptNames('');
                          setSelectedDepts(null);
                        }}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                        <Icon
                          name="close-circle"
                          size={16}
                          color="#ccc"
                          style={styles.iconMargin}
                        />
                      </TouchableOpacity>
                    ) : (
                      <Icon
                        name="right"
                        size={15}
                        color="#ccc"
                        style={styles.iconMargin}
                      />
                    )}
                  </View>
                </View>
                {deptNames ? (
                  <View style={styles.selectedDeptsContainer}>
                    <Text style={styles.selectedDeptsText}>{deptNames}</Text>
                  </View>
                ) : null}
              </View>
            </Form.Item>

            <Form.Item
              name="realDepartments"
              onPress={() => setRealDeptPickerVisible(true)}>
              <View style={styles.customFormItemCol}>
                <View style={styles.customFormItemRow}>
                  <View style={styles.customLabelContainer}>
                    <Text style={styles.formLabel}>执法人员(接口)</Text>
                  </View>
                  <View style={styles.customValueContainer}>
                    {!realDeptNames ? (
                      <Text style={styles.formInputText}>请选择(多选)</Text>
                    ) : null}
                    {realDeptNames ? (
                      <TouchableOpacity
                        onPress={() => {
                          form.setFieldsValue({
                            realDepartments: undefined,
                          } as any);
                          setRealDeptNames('');
                          setSelectedRealDepts(null);
                        }}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                        <Icon
                          name="close-circle"
                          size={16}
                          color="#ccc"
                          style={styles.iconMargin}
                        />
                      </TouchableOpacity>
                    ) : (
                      <Icon
                        name="right"
                        size={15}
                        color="#ccc"
                        style={styles.iconMargin}
                      />
                    )}
                  </View>
                </View>
                {realDeptNames ? (
                  <View style={styles.selectedDeptsContainer}>
                    <Text style={styles.selectedDeptsText}>
                      {realDeptNames}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Form.Item>

            <Form.Item
              name="isPassed"
              label="检查结果"
              labelStyle={styles.formLabel}
              rules={[{required: true, message: '请选择结果'}]}>
              <Radio.Group style={styles.radioGroup}>
                <View style={styles.radioRow}>
                  <Radio value="1" style={styles.radioGap}>
                    合格
                  </Radio>
                  <Radio value="2" style={styles.radioGap}>
                    不合格
                  </Radio>
                  <Radio value="3" style={styles.radioLast}>
                    责令整改
                  </Radio>
                </View>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="checkOptions"
              label="检查项目"
              labelStyle={styles.formLabel}>
              <View style={styles.checkboxRow}>
                {CHECK_OPTIONS.map(opt => (
                  <Checkbox
                    key={opt.value}
                    checked={selectedOptions.includes(opt.value)}
                    style={styles.checkboxGap}
                    onChange={e =>
                      handleCheckboxGroupChange(opt.value, e.target.checked)
                    }>
                    <Text style={styles.checkboxLabel}>{opt.label}</Text>
                  </Checkbox>
                ))}
              </View>
            </Form.Item>

            <View style={styles.feedbackHeaderRow}>
              <Text style={styles.formLabel}>检查意见</Text>
              <Text style={styles.charCountText}>
                {feedbackValue.length}/200
              </Text>
            </View>
            <Form.Item name="feedback" normalize={v => v?.trim()}>
              <Input.TextArea
                placeholder="请输入详细的检查意见或整改要求..."
                rows={4}
                maxLength={200}
                inputStyle={styles.feedbackInput}
              />
            </Form.Item>
          </DetailSection>

          <DetailSection title="照片附件">
            <View style={styles.attachmentContainer}>
              <View style={styles.imageGrid}>
                {images.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.imageItem,
                      item.status === 'error' ? styles.imageItemError : null,
                      (index + 1) % 4 === 0 ? styles.imageItemLastInRow : null,
                    ]}>
                    <TouchableOpacity
                      onPress={() =>
                        item.status === 'done' && handlePreview(item.uri)
                      }
                      activeOpacity={0.9}
                      style={styles.imagePressable}>
                      <Image
                        source={{uri: item.uri}}
                        style={styles.thumbnail}
                      />
                    </TouchableOpacity>
                    {item.status === 'uploading' && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.uploadingText} numberOfLines={1}>
                          上传中
                        </Text>
                      </View>
                    )}
                    {item.status === 'error' && (
                      <TouchableOpacity
                        onPress={() => handleRetryImage(item)}
                        style={styles.errorOverlay}
                        activeOpacity={0.8}>
                        <Icon name="reload" size={16} color="#fff" />
                        <Text style={styles.retryText} numberOfLines={1}>
                          重试
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeleteImage(item.id)}
                      style={styles.deleteBtn}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      activeOpacity={0.8}>
                      <Icon name="close" size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 9 && (
                  <TouchableOpacity
                    onPress={handlePickImages}
                    style={[
                      styles.uploadCard,
                      (images.length + 1) % 4 === 0
                        ? styles.imageItemLastInRow
                        : null,
                    ]}
                    activeOpacity={0.7}>
                    <Icon name="plus" size={24} color="#999" />
                    <Text style={styles.uploadCardText}>添加照片</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.imageHint}>
                已选择 {images.length}/9 张图片，格式限制为 PNG、JPG、JPEG
              </Text>
            </View>
          </DetailSection>

          <DetailSection title="文件附件">
            <View style={styles.attachmentContainer}>
              <View style={styles.fileList}>
                {files.map(item => {
                  const sizeText = item.size
                    ? item.size < 1024
                      ? `${item.size} B`
                      : item.size < 1024 * 1024
                      ? `${(item.size / 1024).toFixed(1)} KB`
                      : `${(item.size / (1024 * 1024)).toFixed(1)} MB`
                    : '';

                  const ext = item.name.split('.').pop()?.toLowerCase();
                  let fileIcon = '📄';
                  if (ext) {
                    if (
                      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
                    ) {
                      fileIcon = '🖼';
                    } else if (
                      ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)
                    ) {
                      fileIcon = '🎬';
                    } else if (
                      ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
                    ) {
                      fileIcon = '📦';
                    } else if (
                      [
                        'doc',
                        'docx',
                        'pdf',
                        'txt',
                        'xls',
                        'xlsx',
                        'ppt',
                        'pptx',
                      ].includes(ext)
                    ) {
                      fileIcon = '📝';
                    }
                  }

                  return (
                    <View key={item.id} style={styles.fileRow}>
                      <TouchableOpacity
                        style={styles.fileClickArea}
                        activeOpacity={0.7}
                        onPress={() => handlePreviewFile(item)}
                        disabled={item.status !== 'done'}>
                        <Text style={styles.fileIcon}>{fileIcon}</Text>
                        <View style={styles.fileMeta}>
                          <Text style={styles.fileNameText} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {sizeText ? (
                            <Text style={styles.fileSizeText}>{sizeText}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.fileActions}>
                        {item.status === 'uploading' && (
                          <ActivityIndicator size="small" color="#0C68F2" />
                        )}
                        {item.status === 'error' && (
                          <TouchableOpacity
                            onPress={() => handleRetryFile(item)}
                            style={styles.fileRetryBtn}
                            activeOpacity={0.8}>
                            <Icon name="reload" size={14} color="#ff4d4f" />
                            <Text style={styles.fileRetryText}>重试</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'done' && (
                          <Icon
                            name="check-circle"
                            size={16}
                            color="#52c41a"
                            style={styles.successIcon}
                          />
                        )}
                        <TouchableOpacity
                          onPress={() => handleDeleteFile(item.id)}
                          style={styles.fileDeleteBtn}
                          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                          activeOpacity={0.8}>
                          <Icon name="close" size={14} color="#999" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
              {files.length < 9 && (
                <TouchableOpacity
                  onPress={handlePickFiles}
                  style={styles.uploadFileBtn}
                  activeOpacity={0.7}>
                  <Icon
                    name="upload"
                    size={16}
                    color="#0C68F2"
                    style={styles.uploadIcon}
                  />
                  <Text style={styles.uploadFileBtnText}>上传文件附件</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.imageHint}>
                已上传 {files.filter(f => f.status === 'done').length}/
                {files.length} 个文件，最多可上传 9
                个文件（已上传文件可点击文件名预览/下载）
              </Text>
            </View>
          </DetailSection>
        </Form>

        <Button
          type="primary"
          onPress={handleSubmit}
          style={[styles.submitBtn, {backgroundColor: colors.primary}]}>
          提交检查单
        </Button>

        <View style={styles.demoButtonsContainer}>
          <Text style={styles.demoSectionTitle}>
            吸顶提示（StickyNotice）接口演示：
          </Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              onPress={() => {
                StickyNotice.info({
                  title: '普通信息提示',
                  content: '提示：请录入正确的企业名称与相应执法人员身份信息。',
                });
              }}
              style={[styles.demoBtn, styles.btnInfo]}>
              <Text style={[styles.demoBtnText, styles.textInfo]}>Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                StickyNotice.success({
                  title: '操作成功',
                  content: '表单提交并存入草稿箱成功，等待同步。',
                });
              }}
              style={[styles.demoBtn, styles.btnSuccess]}>
              <Text style={[styles.demoBtnText, styles.textSuccess]}>
                Success
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                StickyNotice.warning({
                  title: '验证提醒',
                  content: '请核实您上传的电子营业执照是否仍在有效期内！',
                });
              }}
              style={[styles.demoBtn, styles.btnWarning]}>
              <Text style={[styles.demoBtnText, styles.textWarning]}>
                Warning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                StickyNotice.error({
                  title: '错误拦截',
                  content: '上传的附件格式错误，系统仅支持图片和PDF文件。',
                });
              }}
              style={[styles.demoBtn, styles.btnError]}>
              <Text style={[styles.demoBtnText, styles.textError]}>Error</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.demoButtonsRow, styles.rowMarginTop]}>
            <TouchableOpacity
              onPress={() => {
                StickyNotice.info(
                  '一条最简的仅有正文内容的吸顶通知，标题将默认显示“提示”。',
                );
              }}
              style={[styles.demoBtnFull, styles.btnDefault]}>
              <Text style={[styles.demoBtnText, styles.textDefault]}>
                最简文本模式（默认标题 "提示"）
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部选择器弹窗 */}
      <Picker
        visible={typePickerVisible}
        data={CHECK_TYPE_OPTIONS}
        cols={1}
        onOk={val => {
          const item = CHECK_TYPE_OPTIONS.find(o => o.value === val[0]);
          if (item) {
            form.setFieldsValue({checkType: String(item.value)});
            setCheckTypeName(item.label);
          }
          setTypePickerVisible(false);
        }}
        onDismiss={() => setTypePickerVisible(false)}
      />

      {/* 底部日历弹窗 */}
      <Modal
        popup
        visible={calendarVisible}
        animationType="slide-up"
        onClose={() => setCalendarVisible(false)}>
        <View style={styles.calendarDrawer}>
          <View style={styles.calendarDrawerHeader}>
            <TouchableOpacity
              onPress={() => setCalendarVisible(false)}
              style={styles.drawerHeaderLeft}>
              <Icon name="close" size={16} color="#666" />
            </TouchableOpacity>
            <Text style={styles.calendarDrawerTitle}>选择检查日期</Text>
            <TouchableOpacity
              onPress={handleCalendarConfirm}
              style={styles.drawerHeaderRight}>
              <Text style={styles.drawerHeaderConfirmText}>确认</Text>
            </TouchableOpacity>
          </View>
          <Calendar
            ref={calendarRef}
            mode="single"
            value={tempDate}
            onChange={setTempDate}
            panelDate={panelDate}
            onPanelChange={setPanelDate}
          />
        </View>
      </Modal>

      {/* 多级多选下拉树 */}
      <DaDropdownTreePicker
        data={DEPARTMENTS_MOCK}
        multiple
        value={selectedDepts}
        onChange={handleDeptConfirm}
        visible={deptPickerVisible}
        onVisibleChange={setDeptPickerVisible}
      />

      {/* 真实接口多级树 */}
      <DaDropdownColTreePicker
        data={realDeptData}
        multiple
        value={selectedRealDepts}
        onChange={handleRealDeptConfirm}
        visible={realDeptPickerVisible}
        onVisibleChange={setRealDeptPickerVisible}
      />

      {/* 图片预览弹窗 */}
      <RNModal
        visible={previewVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.previewModalContainer}>
          <TouchableOpacity
            style={styles.previewModalClose}
            onPress={() => setPreviewVisible(false)}
            activeOpacity={0.8}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {previewUri ? (
            <Image
              source={{uri: previewUri}}
              style={styles.previewImageFull}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </RNModal>
    </KeyboardAvoidingView>
  );
}

const {width: screenWidth} = Dimensions.get('window');
const GRID_GAP = 8;
const ITEM_SIZE = Math.floor((screenWidth - 62 - GRID_GAP * 3) / 4);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },
  customFormItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 44,
  },
  customFormItemCol: {
    flexDirection: 'column',
    width: '100%',
    paddingVertical: 4,
  },
  selectedDeptsContainer: {
    width: '100%',
    paddingVertical: 8,
    paddingRight: 24,
  },
  selectedDeptsText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    textAlign: 'left',
  },
  customLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  asterisk: {
    position: 'absolute',
    left: -8,
    color: '#ff4d4f',
    fontSize: 15,
  },
  customValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  formLabel: {
    fontSize: 15,
    color: '#333',
    minWidth: 80,
  },
  formInput: {
    textAlign: 'right',
    fontSize: 15,
  },
  formInputText: {
    flex: 1,
    fontSize: 15,
    color: '#ccc',
    textAlign: 'right',
  },
  formInputFilled: {
    color: '#333',
  },
  iconMargin: {
    marginLeft: 8,
  },
  radioGroup: {
    flex: 1,
    width: '100%',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  radioGap: {
    marginRight: 15,
    marginVertical: 4,
  },
  radioLast: {
    marginVertical: 4,
  },
  submitBtn: {
    marginTop: 30,
    borderRadius: 8,
    borderWidth: 0,
  },
  calendarDrawer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
  },
  calendarDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  calendarDrawerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  drawerHeaderLeft: {
    padding: 8,
    marginLeft: -8,
  },
  drawerHeaderRight: {
    padding: 8,
    marginRight: -8,
  },
  drawerHeaderConfirmText: {
    fontSize: 15,
    color: '#0C68F2',
  },
  attachmentContainer: {
    marginTop: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
    position: 'relative',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  imageItemError: {
    borderColor: '#ff4d4f',
  },
  imageItemLastInRow: {
    marginRight: 0,
  },
  imagePressable: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
  },
  deleteBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: GRID_GAP,
  },
  uploadCardText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  imageHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  previewModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    padding: 10,
    zIndex: 100,
  },
  previewImageFull: {
    width: '90%',
    height: '80%',
  },
  fileList: {
    marginTop: 4,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eef1f6',
  },
  fileClickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileMeta: {
    flex: 1,
    marginRight: 12,
  },
  fileNameText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSizeText: {
    fontSize: 11,
    color: '#999',
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f0',
    borderWidth: 1,
    borderColor: '#ffa39e',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  fileRetryText: {
    fontSize: 11,
    color: '#ff4d4f',
    marginLeft: 4,
  },
  successIcon: {
    marginRight: 8,
  },
  fileDeleteBtn: {
    padding: 4,
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0C68F2',
    backgroundColor: '#f6f9fe',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  uploadFileBtnText: {
    fontSize: 14,
    color: '#0C68F2',
    fontWeight: '500',
  },
  uploadIcon: {
    marginRight: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    flex: 1,
  },
  checkboxGap: {
    marginRight: 15,
    marginVertical: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  feedbackInput: {
    fontSize: 15,
    textAlign: 'left',
    width: '100%',
    paddingVertical: 4,
  },
  charCountText: {
    fontSize: 12,
    color: '#999',
  },
  noticeBtn: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  noticeBtnText: {
    fontSize: 18,
    fontWeight: '500',
  },
  demoButtonsContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  demoSectionTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoBtn: {
    flex: 1,
    marginHorizontal: 3,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  demoBtnFull: {
    flex: 1,
    marginHorizontal: 3,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rowMarginTop: {
    marginTop: 10,
  },
  btnInfo: {
    borderColor: '#0C68F2',
  },
  textInfo: {
    color: '#0C68F2',
  },
  btnSuccess: {
    borderColor: '#52c41a',
  },
  textSuccess: {
    color: '#52c41a',
  },
  btnWarning: {
    borderColor: '#faad14',
  },
  textWarning: {
    color: '#faad14',
  },
  btnError: {
    borderColor: '#ff4d4f',
  },
  textError: {
    color: '#ff4d4f',
  },
  btnDefault: {
    borderColor: '#8c8c8c',
  },
  textDefault: {
    color: '#8c8c8c',
  },
});
