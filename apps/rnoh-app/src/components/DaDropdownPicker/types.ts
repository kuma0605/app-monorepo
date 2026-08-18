export interface DropdownItem {
  label: string;
  value: string;
  children?: DropdownItem[];
  [key: string]: any; // 允许其他自定义属性
}

export interface DaDropdownPickerProps {
  data: DropdownItem[];
  value?: DropdownItem | DropdownItem[] | null;
  onChange?: (value: DropdownItem | DropdownItem[] | null) => void;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export interface ColumnState {
  data: DropdownItem[];
  selectedValue: string | null;
}
