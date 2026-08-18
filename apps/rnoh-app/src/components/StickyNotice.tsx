import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import {Icon} from '@ant-design/react-native';

export type StickyNoticeType = 'info' | 'success' | 'warning' | 'error';

export interface StickyNoticeProps {
  visible?: boolean;
  onClose?: () => void;
  type?: StickyNoticeType;
  title?: string;
  content?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}

export interface StickyNoticeShowOptions {
  type?: StickyNoticeType;
  title?: string;
  content: React.ReactNode;
  duration?: number;
}

export interface StickyNoticeInterface {
  (props: StickyNoticeProps): React.JSX.Element | null;
  show: (options: StickyNoticeShowOptions) => void;
  hide: () => void;
  info: (options: Omit<StickyNoticeShowOptions, 'type'> | string) => void;
  success: (options: Omit<StickyNoticeShowOptions, 'type'> | string) => void;
  warning: (options: Omit<StickyNoticeShowOptions, 'type'> | string) => void;
  error: (options: Omit<StickyNoticeShowOptions, 'type'> | string) => void;
}

type StickyListener = (
  options: StickyNoticeShowOptions & {visible: boolean},
) => void;

let activeListener: StickyListener | null = null;

export const StickyNoticeManager = {
  register(listener: StickyListener) {
    activeListener = listener;
  },
  unregister() {
    activeListener = null;
  },
  show(options: StickyNoticeShowOptions) {
    if (activeListener) {
      activeListener({...options, visible: true});
    }
  },
  hide() {
    if (activeListener) {
      activeListener({visible: false, content: null});
    }
  },
};

const TYPE_CONFIG = {
  info: {
    icon: 'info-circle' as const,
    iconColor: '#0C68F2',
    borderColor: '#adc6ff',
    backgroundColor: '#f0f5ff',
    titleColor: '#1d39c4',
    descColor: '#2f54eb',
  },
  success: {
    icon: 'check-circle' as const,
    iconColor: '#52c41a',
    borderColor: '#b7eb8f',
    backgroundColor: '#f6ffed',
    titleColor: '#389e0d',
    descColor: '#52c41a',
  },
  warning: {
    icon: 'exclamation-circle' as const,
    iconColor: '#faad14',
    borderColor: '#ffe58f',
    backgroundColor: '#fffbe6',
    titleColor: '#d46b08',
    descColor: '#fa8c16',
  },
  error: {
    icon: 'close-circle' as const,
    iconColor: '#ff4d4f',
    borderColor: '#ffccc7',
    backgroundColor: '#fff2f0',
    titleColor: '#cf1322',
    descColor: '#f5222d',
  },
};

function StickyNoticeComponent({
  visible: propsVisible,
  onClose: propsOnClose,
  type: propsType,
  title: propsTitle,
  content: propsContent,
  children,
  style,
  duration: propsDuration,
}: StickyNoticeProps) {
  // 内部状态用于支持命令式（API）模式
  const [internalState, setInternalState] = useState<{
    visible: boolean;
    type: StickyNoticeType;
    title: string;
    content: React.ReactNode;
    duration?: number;
    showId?: string;
  }>({
    visible: false,
    type: 'info',
    title: '提示',
    content: null,
    duration: undefined,
    showId: undefined,
  });

  const isDeclarative = propsVisible !== undefined;

  const visible = isDeclarative ? propsVisible : internalState.visible;
  const type = isDeclarative ? propsType ?? 'info' : internalState.type;
  const title = isDeclarative ? propsTitle ?? '提示' : internalState.title;
  const content = isDeclarative ? propsContent : internalState.content;

  const handleClose = useCallback(() => {
    if (isDeclarative) {
      propsOnClose?.();
    } else {
      setInternalState(prev => ({...prev, visible: false}));
    }
  }, [isDeclarative, propsOnClose]);

  // 定时关闭逻辑
  useEffect(() => {
    if (!visible) {
      return;
    }

    // 命令式默认 3000ms，声明式默认不自动关闭（除非传入了 duration）
    const duration = isDeclarative
      ? propsDuration
      : internalState.duration !== undefined
      ? internalState.duration
      : 3000;

    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [
    visible,
    isDeclarative,
    propsDuration,
    internalState.duration,
    internalState.showId,
    handleClose,
  ]);

  useEffect(() => {
    if (!isDeclarative) {
      StickyNoticeManager.register(options => {
        setInternalState({
          visible: options.visible,
          type: options.type ?? 'info',
          title: options.title ?? '提示',
          content: options.content,
          duration: options.duration,
          showId: options.visible
            ? `${Date.now()}-${Math.random()}`
            : undefined,
        });
      });
      return () => {
        StickyNoticeManager.unregister();
      };
    }
  }, [isDeclarative]);

  if (!visible) {
    return null;
  }

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const renderContent = () => {
    const mainContent = content !== undefined ? content : children;
    if (typeof mainContent === 'string') {
      return (
        <Text style={[styles.stickyNoticeDesc, {color: config.descColor}]}>
          {mainContent}
        </Text>
      );
    }
    return mainContent;
  };

  return (
    <View
      style={[
        styles.stickyNotice,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}>
      {/* 第一行：前缀（图标）+ 文字（标题）+ 后缀（关闭按钮） */}
      <View style={styles.stickyNoticeHeader}>
        <View style={styles.stickyNoticeTitleContainer}>
          <Icon
            name={config.icon}
            size={16}
            color={config.iconColor}
            style={styles.stickyNoticeIcon}
          />
          <Text style={[styles.stickyNoticeTitle, {color: config.titleColor}]}>
            {title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.stickyNoticeCloseBtn}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Icon name="close" size={14} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 第二行/下方：提示内容 */}
      <View style={styles.stickyNoticeBody}>{renderContent()}</View>
    </View>
  );
}

// 绑定静态 API 方法到组件上
const StickyNotice = StickyNoticeComponent as any as StickyNoticeInterface;

StickyNotice.show = StickyNoticeManager.show;
StickyNotice.hide = StickyNoticeManager.hide;

const createShortcut = (type: StickyNoticeType) => {
  return (options: Omit<StickyNoticeShowOptions, 'type'> | string) => {
    if (typeof options === 'string') {
      StickyNoticeManager.show({type, content: options});
    } else {
      StickyNoticeManager.show({...options, type});
    }
  };
};

StickyNotice.info = createShortcut('info');
StickyNotice.success = createShortcut('success');
StickyNotice.warning = createShortcut('warning');
StickyNotice.error = createShortcut('error');

export default StickyNotice;

const styles = StyleSheet.create({
  stickyNotice: {
    position: 'absolute',
    top: 10,
    left: 15,
    right: 15,
    zIndex: 9999,
    flexDirection: 'column',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  stickyNoticeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stickyNoticeIcon: {
    marginRight: 8,
  },
  stickyNoticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stickyNoticeCloseBtn: {
    padding: 2,
  },
  stickyNoticeBody: {
    width: '100%',
  },
  stickyNoticeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
