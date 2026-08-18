import {Alert} from 'react-native';
import {Toast} from '@ant-design/react-native';

/** 确认对话框 */
export function useConfirm(
  content: string,
  options: {title?: string; okText?: string; cancelText?: string} = {},
): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      options.title || '提示',
      content,
      [
        {
          text: options.cancelText || '取消',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: options.okText || '确定',
          onPress: () => resolve(true),
        },
      ],
      {cancelable: false},
    );
  });
}

/** 提示 */
export function useToast(message: string, duration = 2): Promise<void> {
  return new Promise(resolve => {
    Toast.info(message, duration, undefined, false);
    setTimeout(resolve, duration * 1000);
  });
}

/** 成功提示 */
export function useSuccess(message: string, duration = 2): Promise<void> {
  return new Promise(resolve => {
    Toast.success(message, duration, undefined, false);
    setTimeout(resolve, duration * 1000);
  });
}

/** 失败提示 */
export function useFail(message: string, duration = 2): Promise<void> {
  return new Promise(resolve => {
    Toast.fail(message, duration, undefined, false);
    setTimeout(resolve, duration * 1000);
  });
}
