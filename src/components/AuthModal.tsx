import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Sparkles } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import {
  signInWithApple,
  signInWithGoogle,
  applyAuthResult,
  wasCanceled,
} from '../services/socialAuth';
import { triggerHaptic } from '../utils/haptics';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, onSuccess }) => {
  const { theme, showToast, setUserProfile, setUserGoals, setIsPremium } = useApp();
  const [loadingType, setLoadingType] = useState<'apple' | 'google' | null>(null);

  const runSignIn = async (
    provider: 'apple' | 'google',
    label: string,
    signIn: () => Promise<any>
  ) => {
    try {
      setLoadingType(provider);
      triggerHaptic('medium');

      const outcome = await signIn();
      if (wasCanceled(outcome)) return;

      applyAuthResult(outcome, setUserProfile, setUserGoals, setIsPremium);

      triggerHaptic('success');
      showToast(`Đăng nhập bằng ${label} thành công!`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      triggerHaptic('error');
      Alert.alert('Lỗi đăng nhập', e.message || `Không thể đăng nhập bằng ${label}.`);
    } finally {
      setLoadingType(null);
    }
  };

  const handleAppleAuth = () => runSignIn('apple', 'Apple ID', signInWithApple);
  const handleGoogleAuth = () => runSignIn('google', 'Google', signInWithGoogle);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Sparkles size={14} color="#10B981" />
              <Text style={styles.badgeText}>Tài khoản CalorieIQ</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Đăng nhập vào CalorieIQ
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Đăng nhập để lưu mục tiêu dinh dưỡng và quản lý gói CalorieIQ Pro của bạn.
          </Text>

          {/* Social Sign-In Buttons */}
          <View style={styles.btnGroup}>
            {/* Apple Sign-In Button (Guideline-compliant) */}
            <TouchableOpacity
              onPress={handleAppleAuth}
              disabled={loadingType !== null}
              activeOpacity={0.85}
              style={[styles.socialBtn, styles.appleBtn]}
            >
              {loadingType === 'apple' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.socialIcon}></Text>
                  <Text style={[styles.socialBtnText, { color: '#fff' }]}>Tiếp tục với Apple</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              onPress={handleGoogleAuth}
              disabled={loadingType !== null}
              activeOpacity={0.85}
              style={[styles.socialBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
            >
              {loadingType === 'google' ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={[styles.socialIcon, { fontSize: 18, marginRight: 8 }]}>🌐</Text>
                  <Text style={[styles.socialBtnText, { color: theme.text }]}>Tiếp tục với Google</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <Text style={[styles.disclaimer, { color: theme.textTertiary }]}>
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của CalorieIQ.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  btnGroup: {
    gap: 12,
  },
  socialBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtn: {
    backgroundColor: '#000000',
    borderColor: '#333333',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 22,
    color: '#fff',
    marginRight: 10,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 20,
    paddingHorizontal: 12,
  },
});
