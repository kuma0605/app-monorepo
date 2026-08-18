import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import {createSelector} from '@reduxjs/toolkit';
import type {RootState, AppDispatch} from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ─── User Selectors ──────────────────────────────────────────────────────────

const selectUserState = (state: RootState) => state.user;

/** 用户 ID */
export const selectUserId = createSelector(
  selectUserState,
  user => user.profile?.id ?? '',
);

/** 用户名 */
export const selectUsername = createSelector(
  selectUserState,
  user => user.profile?.name ?? '',
);

/** 实名状态：1-未实名 2-实名中 3-已实名 4-实名失败 */
export const selectRealStatus = createSelector(
  selectUserState,
  user => user.profile?.realStatus ?? 0,
);

// ─── Menu Selectors ──────────────────────────────────────────────────────────

/** 菜单数据 */
export const selectMenuData = (state: RootState) => state.menu.menuData;

// ─── App Selectors ───────────────────────────────────────────────────────────

/** 主题色 */
export const selectPrimaryColor = (state: RootState) =>
  state.app.themeConfig.primaryColor;

/** 应用名称 */
export const selectAppName = (state: RootState) => state.app.siteInfo.appName;
