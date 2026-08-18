import type {DocumentPickerResponse} from 'react-native-document-picker';

import {ensureUploadablePath} from './ensureUploadablePath';

/** React Native FormData 文件字段（uri / name / type） */
export type UploadFilePayload = {
  uri: string;
  name: string;
  type: string;
};

/** 将 DocumentPicker 结果转为可 append 到 FormData 的文件对象 */
export async function toUploadFilePayload(
  picked: DocumentPickerResponse,
): Promise<UploadFilePayload> {
  const {path} = await ensureUploadablePath(picked);

  return {
    uri: path,
    name: picked.name ?? 'file',
    type: picked.type ?? 'application/octet-stream',
  };
}

export type BuildUploadFormDataOptions = {
  /** 表单字段名，默认 `file`（对应 baseService.uploadFile） */
  fieldName?: string;
  /** 额外文本字段，如 bizType、refId 等 */
  extraFields?: Record<string, string>;
};

/** 由 picker 结果构建 multipart FormData，可直接传给 uploadFile / dictateFeedBack 等 */
export async function buildUploadFormDataFromPickedFile(
  picked: DocumentPickerResponse,
  options?: BuildUploadFormDataOptions,
): Promise<FormData> {
  const formData = new FormData();
  const payload = await toUploadFilePayload(picked);

  formData.append(options?.fieldName ?? 'file', payload as never);

  if (options?.extraFields) {
    Object.entries(options.extraFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return formData;
}
