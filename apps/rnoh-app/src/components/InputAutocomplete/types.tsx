import type {
  NativeSyntheticEvent,
  TextInputFocusEventData,
  View,
} from 'react-native';

export type InputAutocompleteItem =
  | string
  | {text: string; [key: string]: unknown};

export interface InputAutocompleteProps<T = InputAutocompleteItem> {
  value?: string;
  placeholder?: string;
  stringList?: T[];
  debounce?: number;
  min?: number;
  highlightColor?: string;
  loadData?: (keyword: string) => Promise<T[]>;
  onChangeText?: (text: string) => void;
  onSelectItem?: (data: T) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  /** 聚焦时把输入框滚入键盘上方可见区域（与 useFormKeyboardScroll 配合） */
  scrollIntoView?: (anchorRef: React.RefObject<View | null>) => void;
  inputStyle?: object;
  style?: object;
  disabled?: boolean;
  testID?: string;
}

export interface InputAutocompleteRef {
  dismiss: () => void;
  setInputValue: (value: string) => void;
  getInputValue: () => string;
}
