import React from 'react';
import {SUB_STACK_HEADER_BG} from '@/theme/colors';
import {SubStackHeaderBack} from './SubStackHeaderBack';

type NavLike = {
  canGoBack: () => boolean;
  goBack: () => void;
};

/**
 * 各 Tab 子 Stack 共用的顶栏：背景 #171933、白字居中、AntD left 图标作返回。
 */
export function defaultSubStackScreenOptions({
  navigation,
}: {
  navigation: NavLike;
}) {
  const canGoBack = navigation.canGoBack();
  return {
    headerStyle: {
      backgroundColor: SUB_STACK_HEADER_BG,
      shadowOpacity: 0,
      elevation: 0,
      borderBottomWidth: 0,
    },
    headerShadowVisible: false,
    headerTintColor: '#fff',
    headerTitleStyle: {color: '#fff'},
    headerTitleAlign: 'center' as const,
    ...(canGoBack
      ? {
          headerBackVisible: false,
          headerLeft: () => (
            <SubStackHeaderBack onPress={() => navigation.goBack()} />
          ),
        }
      : {}),
  };
}
