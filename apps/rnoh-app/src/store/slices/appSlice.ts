import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface AppState {
  themeConfig: {
    primaryColor: string;
  };
  siteInfo: {
    appName: string;
  };
  systemInfo: Record<string, any>;
  updateInfo: {
    hasUpdate: boolean;
    latestVersion: string;
    downloadUrl: string;
    forceUpdate: boolean;
    ignoredVersion: string;
  };
}

const initialState: AppState = {
  themeConfig: {
    primaryColor: '#028d71',
  },
  siteInfo: {
    appName: '市场监管',
  },
  systemInfo: {},
  updateInfo: {
    hasUpdate: false,
    latestVersion: '',
    downloadUrl: '',
    forceUpdate: false,
    ignoredVersion: '',
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setPrimaryColor(state, action: PayloadAction<string>) {
      state.themeConfig.primaryColor = action.payload;
    },
    setSiteInfo(state, action: PayloadAction<Partial<AppState['siteInfo']>>) {
      state.siteInfo = {...state.siteInfo, ...action.payload};
    },
    setSystemInfo(state, action: PayloadAction<Record<string, any>>) {
      state.systemInfo = action.payload;
    },
    setUpdateInfo(
      state,
      action: PayloadAction<Partial<AppState['updateInfo']>>,
    ) {
      state.updateInfo = {...state.updateInfo, ...action.payload};
    },
    setIgnoredVersion(state, action: PayloadAction<string>) {
      state.updateInfo.ignoredVersion = action.payload;
    },
  },
});

export const {
  setPrimaryColor,
  setSiteInfo,
  setSystemInfo,
  setUpdateInfo,
  setIgnoredVersion,
} = appSlice.actions;
export default appSlice.reducer;
