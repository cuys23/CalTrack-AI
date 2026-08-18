import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Mail, Lock, User, Sparkles, Apple, CheckCircle } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../services/apiClient';
import { triggerHaptic } from '../utils/haptics';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, onSuccess }) => {
  const { theme, showToast, setUserProfile, setUserGoals } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !name)) {
      triggerHaptic('error');
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    try {
      setLoading(true);
      triggerHaptic('medium');

      if (isRegister) {
        const res = await apiClient.register({
          name,
          email,
          password,
        });

        if (res.user) {
          setUserProfile(prev => ({
            ...prev,
            name: res.user.name || prev.name,
          }));
          if (res.user.daily_goal) {
            setUserGoals(prev => ({
              ...prev,
              targetCalories: res.user.daily_goal.target_calories || prev.targetCalories,
              targetProtein: res.user.daily_goal.protein_g || prev.targetProtein,
              targetCarbs: res.user.daily_goal.carbs_g || prev.targetCarbs,
              targetFat: res.user.daily_goal.fat_g || prev.targetFat,
            }));
          }
        }

        triggerHaptic('success');
        showToast('Đăng ký tài khoản thành công!');
      } else {
        const res = await apiClient.login({
          email,
          password,
        });

        if (res.user) {
          setUserProfile(prev => ({
            ...prev,
            name: res.user.name || prev.name,
          }));
          if (res.user.daily_goal) {
            setUserGoals(prev => ({
              ...prev,
              targetCalories: res.user.daily_goal.target_calories || prev.targetCalories,
              targetProtein: res.user.daily_goal.protein_g || prev.targetProtein,
              targetCarbs: res.user.daily_goal.carbs_g || prev.targetCarbs,
              targetFat: res.user.daily_goal.fat_g || prev.targetFat,
            }));
          }
        }

        triggerHaptic('success');
        showToast('Đăng nhập thành công!');
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (e: any) {
      triggerHaptic('error');
      Alert.alert('Lỗi', e.message || 'Không thể xác thực tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Sparkles size={14} color="#10B981" />
              <Text style={styles.badgeText}>CalTrack Cloud Sync</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {isRegister ? 'Tạo tài khoản CalTrack' : 'Đăng nhập CalTrack AI'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isRegister
              ? 'Lưu trữ tiến trình, đồng bộ dữ liệu calo và đồng bộ đa thiết bị an toàn.'
              : 'Tiếp tục theo dõi tiến trình giảm cân và mục tiêu dinh dưỡng của bạn.'}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {isRegister && (
              <View style={[styles.inputContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <User size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Họ và tên của bạn"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  style={[styles.input, { color: theme.text }]}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Mail size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Địa chỉ Email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { color: theme.text }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Lock size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { color: theme.text }]}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, { backgroundColor: '#10B981' }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{isRegister ? 'Tạo Tài Khoản Ngay' : 'Đăng Nhập'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setIsRegister(!isRegister);
              }}
              style={styles.toggleBtn}
            >
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                <Text style={{ color: '#10B981', fontWeight: '700' }}>
                  {isRegister ? 'Đăng nhập' : 'Đăng ký miễn phí'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  form: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
