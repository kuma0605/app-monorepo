import type {DropdownMenuItem, SlotMenuItem} from './types';

const SLOT_MENU_TYPES = new Set<SlotMenuItem['type']>([
  'slot1',
  'slot2',
  'slot3',
  'slot4',
  'slot5',
]);

export function isSlotMenuType(
  type: DropdownMenuItem['type'],
): type is SlotMenuItem['type'] {
  return SLOT_MENU_TYPES.has(type as SlotMenuItem['type']);
}

/** 与 uni-app DaDropdown 一致：有有效 value 则视为已选 */
export function isSlotMenuValueActive(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return false;
}

export type SlotMenuActivePatch = {
  value?: unknown;
  isActived?: boolean;
  activeTitle?: string | null;
};

/** 根据 value 生成 slot 菜单项的高亮字段（可覆盖 activeTitle） */
export function buildSlotMenuActiveState(
  value: unknown,
  options?: {activeTitle?: string | null},
): Pick<SlotMenuItem, 'value' | 'isActived' | 'activeTitle'> {
  const active = isSlotMenuValueActive(value);
  return {
    value,
    isActived: active,
    activeTitle: active ? options?.activeTitle ?? null : null,
  };
}

export function applySlotMenuActiveState(item: SlotMenuItem): SlotMenuItem {
  const active = isSlotMenuValueActive(item.value);
  return {
    ...item,
    isActived: active,
    activeTitle: active ? item.activeTitle ?? null : null,
  };
}

/** 更新菜单中匹配的 slot 项（用于页面侧 setMenu） */
export function patchDropdownSlotMenuItem(
  menu: DropdownMenuItem[],
  match: (item: DropdownMenuItem, index: number) => boolean,
  patch: SlotMenuActivePatch,
): DropdownMenuItem[] {
  return menu.map((item, index) => {
    if (!isSlotMenuType(item.type) || !match(item, index)) {
      return item;
    }
    const slot = item as SlotMenuItem;
    const next: SlotMenuItem = {...slot, ...patch};
    if (patch.isActived === undefined && patch.value !== undefined) {
      next.isActived = isSlotMenuValueActive(patch.value);
    }
    if (next.isActived !== true) {
      next.activeTitle = patch.activeTitle ?? null;
    }
    return next;
  });
}
