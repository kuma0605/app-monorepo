import {apiClient} from './apiClient';
import type {ApiResponse} from '@/types/common.types';
import type {UploadResult} from '@/types/api.types';

/** 上传文件 */
export function uploadFile(
  formData: FormData,
): Promise<ApiResponse<UploadResult>> {
  return apiClient.post<UploadResult>('/file/upload', formData);
}

/** Demo 用上传（与业务 upload 同源入口，便于示例演示） */
export function dictateFeedBack(
  formData: FormData,
  config?: {noLoading?: boolean},
): Promise<ApiResponse<any>> {
  return apiClient.post<any>('/file/upload', formData, config);
}

/** Demo 用部门树：失败时回落本地假数据，保证表单示例可离线浏览 */
export async function getTreeByDeptInspection(): Promise<ApiResponse<any>> {
  try {
    return await apiClient.post<any>(
      '/inspection/info/getTreeByDeptInspection',
      {},
      {noLoading: true},
    );
  } catch {
    return {
      code: 200,
      message: 'ok',
      data: [
        {
          id: '1',
          name: '示例部门 A',
          children: [
            {id: '1-1', name: '子部门 A1'},
            {id: '1-2', name: '子部门 A2'},
          ],
        },
        {
          id: '2',
          name: '示例部门 B',
          children: [{id: '2-1', name: '子部门 B1'}],
        },
      ],
    };
  }
}

/** 检查最新 App 版本（更新弹窗示例用） */
export function getLastAppVersion(config?: {
  noLoading?: boolean;
}): Promise<ApiResponse<any>> {
  return apiClient.post<any>(
    '/sys/versionApp/getLastAppVersion',
    undefined,
    config,
  );
}
