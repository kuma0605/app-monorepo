import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {User} from '../types/common.types';

// ─── State 定义 ────────────────────────────────────────────────────────────────

interface AppState {
  /** 当前登录用户，未登录时为 null */
  user: User | null;
  /** 全局加载状态（用于全屏 Loading 遮罩） */
  isLoading: boolean;
  /** 是否已完成初始化（启动时鉴权检查） */
  isInitialized: boolean;
}

// ─── Actions 定义 ──────────────────────────────────────────────────────────────

interface AppActions {
  /** 设置当前用户（登录后调用） */
  setUser: (user: User | null) => void;
  /** 更新用户信息的部分字段 */
  updateUser: (partial: Partial<User>) => void;
  /** 设置全局加载状态 */
  setLoading: (loading: boolean) => void;
  /** 标记初始化完成 */
  setInitialized: (initialized: boolean) => void;
  /** 登出：清空用户信息 */
  logout: () => void;
}

// ─── Context 类型 ─────────────────────────────────────────────────────────────

type AppContextValue = AppState & AppActions;

// ─── 初始状态 ──────────────────────────────────────────────────────────────────

const initialState: AppState = {
  user: null,
  isLoading: false,
  isInitialized: false,
};

// ─── Context 创建 ─────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({children}: AppProviderProps) {
  const [user, setUserState] = useState<User | null>(initialState.user);
  const [isLoading, setLoadingState] = useState(initialState.isLoading);
  const [isInitialized, setInitializedState] = useState(
    initialState.isInitialized,
  );

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUserState(prev => {
      if (!prev) {
        return prev;
      }
      return {...prev, ...partial};
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(loading);
  }, []);

  const setInitialized = useCallback((initialized: boolean) => {
    setInitializedState(initialized);
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
  }, []);

  const value: AppContextValue = {
    // state
    user,
    isLoading,
    isInitialized,
    // actions
    setUser,
    updateUser,
    setLoading,
    setInitialized,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * 访问全局应用状态
 *
 * @example
 * const { user, setUser, logout } = useAppContext();
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within <AppProvider>');
  }
  return context;
}

/**
 * 仅访问当前用户（避免不必要的重渲染）
 *
 * @example
 * const user = useCurrentUser();
 */
export function useCurrentUser(): User | null {
  return useAppContext().user;
}

/**
 * 判断用户是否已登录
 *
 * @example
 * const isLoggedIn = useIsLoggedIn();
 */
export function useIsLoggedIn(): boolean {
  return useAppContext().user !== null;
}
