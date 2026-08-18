import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

interface UpdateModalProps {
  visible: boolean;
  latestVersion: string;
  onClose: () => void;
  onConfirm: () => void;
  forceUpdate?: boolean;
}

export default function UpdateModal({
  visible,
  latestVersion,
  onClose,
  onConfirm,
  forceUpdate = false,
}: UpdateModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onClose}>
      <TouchableWithoutFeedback onPress={forceUpdate ? undefined : onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>更新提示</Text>
              <Text style={styles.version}>发现新版本 {latestVersion}</Text>
              <Text style={styles.desc}>是否立即更新？</Text>
              <View style={styles.btnRow}>
                {!forceUpdate && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                    onPress={onClose}>
                    <Text style={styles.cancelText}>取消</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.confirmBtn}
                  activeOpacity={0.7}
                  onPress={onConfirm}>
                  <Text style={styles.confirmText}>立即更新</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  version: {
    fontSize: 15,
    color: '#0C68F2',
    fontWeight: '500',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 28,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0C68F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
