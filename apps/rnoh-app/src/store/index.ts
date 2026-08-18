import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '../native/asyncStorage';
import {
  setGlobalLoadingHandler,
  setTokenProvider,
  setUnauthorizedHandler,
} from '../services/apiClient';
import {Toast} from '@ant-design/react-native';

import userReducer, {logout} from './slices/userSlice';
import globalReducer, {setLoading} from './slices/globalSlice';
import appReducer from './slices/appSlice';

const rootReducer = combineReducers({
  user: userReducer,
  global: globalReducer,
  app: appReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'app'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

setTokenProvider(() => store.getState().user.accessToken);
setGlobalLoadingHandler(isLoading => store.dispatch(setLoading(isLoading)));
setUnauthorizedHandler(() => {
  Toast.info('登录状态已过期，请重新登录');
  store.dispatch(logout());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
