import {memo, useMemo} from 'react';
import {
  StyleSheet,
  View,
  StyleSheet as RNStyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';

export interface PartDropdownFooterProps {
  resetText?: string;
  confirmText?: string;
  themeColor: string;
  onReset: () => void;
  onConfirm: () => void;
}

export const PartDropdownFooter = memo(function PartDropdownFooter({
  resetText,
  confirmText,
  themeColor,
  onReset,
  onConfirm,
}: PartDropdownFooterProps) {
  const dynamic = useMemo(
    () =>
      StyleSheet.create({
        confirm: {borderColor: themeColor, backgroundColor: themeColor},
      }),
    [themeColor],
  );

  return (
    <View style={styles.btnRow}>
      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Text style={styles.resetBtnText}>{resetText ?? '重置'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={RNStyleSheet.flatten([styles.queryBtn, dynamic.confirm])}
        onPress={onConfirm}>
        <Text style={styles.queryBtnText}>{confirmText ?? '确定'}</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  resetBtn: {
    flex: 2,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0C68F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  resetBtnText: {
    color: '#0C68F2',
    fontSize: 15,
  },
  queryBtn: {
    flex: 3,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#0C68F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryBtnText: {
    color: '#fff',
    fontSize: 15,
  },
});
