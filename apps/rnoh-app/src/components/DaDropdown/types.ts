import type {ReactNode} from 'react';

export interface DropdownFieldAlign {
  label?: string;
  value?: string;
  children?: string;
}

export type DropdownMenuItemType =
  | 'search'
  | 'cell'
  | 'click'
  | 'sort'
  | 'filter'
  | 'picker'
  | 'daterange'
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'slot4'
  | 'slot5';

/** 日期范围精度：仅日期，或日期+时分（无秒） */
export type DaterangePrecision = 'day' | 'minute';

/** 日期范围值：day 为 yyyy-MM-dd；minute 为 yyyy-MM-dd HH:mm */
export interface DaterangeValue {
  start: string;
  end: string;
}

/** 快捷标签，value 与 getRangeDate 入参一致（如 '-7'、'7'） */
export interface DaterangeTagItem {
  value: string;
  label: string;
}

/** 与重构前 DaCellOption 对齐的语义（cell 专用） */
export interface DaCellOption {
  showAll?: boolean;
  showIcon?: boolean;
}

export interface DaClickOption {}

export interface DaSortOption {}

export interface DaFilterOption {}

/** 与重构前 DaPickerOption 对齐（picker 专用） */
export interface DaPickerOption {
  showAll?: boolean;
  showIcon?: boolean;
  field?: {label: string; value: string; children: string};
}

/** 与重构前 DaDaterangeOption 对齐 */
export interface DaDaterangeOption {
  value?: DaterangeValue;
}

export interface DropdownOption {
  label: string;
  value: string | number;
  suffix?: string;
  disabled?: boolean;
  children?: DropdownOption[];
  checked?: boolean;
  isActived?: boolean;
}

export interface FilterSubItemRadio {
  type: 'radio';
  prop: string;
  options: DropdownOption[];
  value?: string | number | null;
}

export interface FilterSubItemCheckbox {
  type: 'checkbox';
  prop: string;
  options: DropdownOption[];
  value?: Array<string | number>;
}

export type FilterSubItem = FilterSubItemRadio | FilterSubItemCheckbox;

export interface BaseDropdownMenuItem {
  title: string;
  type: DropdownMenuItemType;
  isHidden?: string | boolean;
  isActived?: boolean;
  activeTitle?: string | null;
  isClick?: boolean;
  prop?: string;
  placeholder?: string;
  resetText?: string;
  confirmText?: string;
  /** 为 true 时，点「重置」同步状态后会触发 onRefresh，并收起下拉面板 */
  resetRefresh?: boolean;
  showAll?: boolean;
  showIcon?: boolean;
  field?: DropdownFieldAlign;
  syncDataFn?: () =>
    | Promise<DropdownOption[] | undefined>
    | DropdownOption[]
    | undefined;
}

export interface SearchMenuItem extends BaseDropdownMenuItem {
  type: 'search';
  value?: string;
}

export interface CellMenuItem extends BaseDropdownMenuItem, DaCellOption {
  type: 'cell';
  options: DropdownOption[];
  value?: string | number | null;
}

export interface ClickMenuItem extends BaseDropdownMenuItem {
  type: 'click';
  value?: boolean;
}

export interface SortMenuItem extends BaseDropdownMenuItem {
  type: 'sort';
  value?: 'asc' | 'desc' | undefined;
}

export interface FilterMenuItem extends BaseDropdownMenuItem {
  type: 'filter';
  options: FilterSubItem[];
  value?: Record<string, unknown>;
}

export interface PickerMenuItem extends BaseDropdownMenuItem {
  type: 'picker';
  options: DropdownOption[];
  value?: Array<string | number> | null;
}

export interface DaterangeMenuItem extends BaseDropdownMenuItem {
  type: 'daterange';
  value?: DaterangeValue | null;
  /**
   * 选择精度，默认 `day`（年月日）。
   * `minute` 为年月日时分，输出 `yyyy-MM-dd HH:mm`，未选时分时默认 `00:00`。
   */
  precision?: DaterangePrecision;
  /** 不传则使用组件内置：本周/上周/本月/上月/近7天/近15天/近30天 */
  dateTagList?: DaterangeTagItem[];
}

export interface SlotMenuItem extends BaseDropdownMenuItem {
  type: 'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5';
  /** 有值时默认高亮标题栏；也可配合 isActived 或 renderSlot 内 setActive 手动控制 */
  value?: unknown;
}

export type SlotActiveOptions = {
  /** 同步写入菜单项 value，便于下次 init 与父组件 state 对齐 */
  value?: unknown;
  /** menuActiveText 为 true 时，高亮状态下可展示自定义文案（不传则仍显示 title） */
  activeTitle?: string | null;
};

export interface SlotRenderParams {
  item: SlotMenuItem;
  index: number;
  /**
   * 关闭下拉：清除各菜单项 `isClick`、收起蒙层与弹层（与点击蒙层一致）。
   * 在 slot 内完成自定义逻辑后调用即可关闭。
   */
  close: () => void;
  /**
   * 设置当前 slot 菜单项是否高亮（与 filter/daterange 的 isActived 一致）。
   * 传 value 时会写入菜单项；仅传 active 时只改高亮状态。
   */
  setActive: (active: boolean, options?: SlotActiveOptions) => void;
}

export type DropdownMenuItem =
  | SearchMenuItem
  | CellMenuItem
  | ClickMenuItem
  | SortMenuItem
  | FilterMenuItem
  | PickerMenuItem
  | DaterangeMenuItem
  | SlotMenuItem;

export type DropdownConfirmAction = 'confirm' | 'reset';

export interface DropdownConfirmOptions {
  /** reset：同步筛选状态、不关闭面板；confirm：提交并关闭面板 */
  action?: DropdownConfirmAction;
  /** 由菜单项 resetRefresh 传入；为 true 时表示重置后也 refresh */
  refresh?: boolean;
}

export interface DaDropdownProps {
  dropdownMenu: DropdownMenuItem[];
  menuActiveText?: boolean;
  themeColor?: string;
  textColor?: string;
  bgColor?: string;
  fixedTop?: boolean;
  fixedTopValue?: number;
  duration?: number;
  menuHeight?: number;
  onOpen?: (index: number) => void;
  onClose?: (lastIndex: number) => void;
  /** 仅同步筛选状态，不在此回调内调用 refresh */
  onConfirm?: (
    payload: Record<string, unknown>,
    options?: DropdownConfirmOptions,
  ) => void;
  /**
   * 列表刷新回调，与 `onConfirm` 配套使用（约定必传）。
   *
   * 当菜单含 `filter` / `picker` / `daterange` / `cell` 且筛选/确定后需要拉列表时，
   * 必须传入（通常为 `usePaginatedList` 的 `refresh`）。
   * 组件在「确定」时调用；重置时仅当对应菜单项 `resetRefresh: true` 时调用。
   *
   * 使用 [`FilterListLayout`](../../components/FilterListLayout/index.tsx) 时，
   * 将 `list.onRefresh` 传给布局即可，内部会自动接到 `DaDropdown`。
   */
  onRefresh?: () => void;
  onDropdownMenuChange?: (menu: DropdownMenuItem[]) => void;
  renderSlot1?: (p: SlotRenderParams) => ReactNode;
  renderSlot2?: (p: SlotRenderParams) => ReactNode;
  renderSlot3?: (p: SlotRenderParams) => ReactNode;
  renderSlot4?: (p: SlotRenderParams) => ReactNode;
  renderSlot5?: (p: SlotRenderParams) => ReactNode;
}
