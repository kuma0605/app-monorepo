import type {DropdownConfirmOptions} from './types';

/** 确定始终 refresh；重置默认不 refresh，菜单项设 resetRefresh: true 时 refresh */
export function shouldRefreshAfterDropdownConfirm(
  options?: DropdownConfirmOptions,
): boolean {
  if (options?.action !== 'reset') {
    return true;
  }
  return options.refresh === true;
}
