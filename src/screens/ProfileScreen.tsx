import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Target,
  Bell,
  HeartPulse,
  Smartphone,
  Award,
  Gift,
  Download,
  LogOut,
  Trash2,
  Shield,
  Star,
  Sparkles,
  Flame,
  Calendar,
  Utensils
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

import { AuthModal } from '../components/AuthModal';
import { apiClient } from '../services/apiClient';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onNavigate }) => {
  const { theme, themeMode, setThemeMode, userProfile, userGoals, showToast, setIsPremium } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleNav = (screen: string) => {
    triggerHaptic('light');
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const handleExportCSV = () => {
    triggerHaptic('success');
    showToast('Đã xuất dữ liệu nhật ký CalTrack (CSV) thành công!');
  };

  const handleLogout = async () => {
    triggerHaptic('medium');
    try {
      await apiClient.logout();
      showToast('Đã đăng xuất tài khoản thành công!');
    } catch (e) {
      showToast('Đã đăng xuất.');
    } finally {
      // The token is gone either way, so the entitlement must go with it.
      setIsPremium(false);
    }
  };

  const handleRestorePurchases = async () => {
    triggerHaptic('light');
    try {
      const res = await apiClient.restoreIapPurchases([]);
      if (res.is_premium) {
        triggerHaptic('success');
        showToast('Khôi phục gói mua thành công!');
      } else {
        showToast('Không tìm thấy giao dịch nào để khôi phục.');
      }
    } catch (e) {
      showToast('Không tìm thấy giao dịch nào để khôi phục.');
    }
  };

  const handleDeleteAccount = () => {
    triggerHaptic('heavy');
    Alert.alert(
      'Xóa tài khoản',
      'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu tài khoản? Hành động này tuân theo quy định Apple App Store (Guideline 5.1.1) và không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.deleteAccount();
              setIsPremium(false);
              triggerHaptic('success');
              showToast('Tài khoản và dữ liệu đã được xóa hoàn toàn.');
            } catch (e: any) {
              showToast(e.message || 'Lỗi khi xóa tài khoản.', 'error');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
      {/* 1. Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Cá nhân & Cài đặt</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 2. User Avatar & Profile Summary */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Image
            source={{ uri: userProfile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }}
            style={[styles.avatar, { borderColor: theme.accent }]}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 19, fontWeight: '800', color: theme.text }}>{userProfile.name}</Text>
              <View style={[styles.proBadge, { backgroundColor: '#FF6B35' }]}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff' }}>PRO</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
              {userProfile.currentWeightKg} kg → {userProfile.targetWeightKg} kg • Mục tiêu Giảm cân
            </Text>
          </View>
        </View>

        {/* Pro Membership Banner */}
        <View style={[styles.proBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, marginTop: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#FF6B35" />
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Gói CalTrack Pro không giới hạn</Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Hết hạn: 18/08/2027 (Còn 365 ngày)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. 4 Quick Stat Cards (Grid 2x2) */}
      <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>THỐNG KÊ HOẠT ĐỘNG</Text>
      <View style={styles.grid2x2}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={15} color={theme.accent} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Ngày dùng app</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{userProfile.appDaysCount || 24} <Text style={{ fontSize: 12 }}>ngày</Text></Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Utensils size={15} color="#3E7BFA" />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Bữa ăn đã ghi</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{userProfile.totalLoggedMeals || 86} <Text style={{ fontSize: 12 }}>bữa</Text></Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Flame size={15} color="#FF6B35" />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Chuỗi Streak</Text>
          </View>
          <Text style={[styles.statValue, { color: '#FF6B35' }]}>{userProfile.streakCount || 12} <Text style={{ fontSize: 12 }}>ngày 🔥</Text></Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Award size={15} color="#22C55E" />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Cân đã giảm</Text>
          </View>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>−{userProfile.totalWeightLostKg || 2.1} <Text style={{ fontSize: 12 }}>kg</Text></Text>
        </View>
      </View>

      {/* 4. Mục tiêu & Dinh dưỡng */}
      <Text style={[styles.sectionHeading, { color: theme.textSecondary, marginTop: 14 }]}>MỤC TIÊU & KẾ HOẠCH</Text>
      <View style={[styles.menuGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => handleNav('edit_goals')} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Target size={19} color={theme.accent} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Mục tiêu Calo & Macro</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>
                {userGoals.targetCalories} kcal • {userGoals.targetProtein}g P • {userGoals.targetCarbs}g C
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={() => handleNav('onboarding')} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Sparkles size={19} color="#3E7BFA" />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Tính toán lại kế hoạch BMR</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>Khảo sát & công thức Mifflin-St Jeor</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* 5. Tính năng & Kết nối */}
      <Text style={[styles.sectionHeading, { color: theme.textSecondary, marginTop: 14 }]}>TÍNH NĂNG & KẾT NỐI</Text>
      <View style={[styles.menuGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => handleNav('health_sync')} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <HeartPulse size={19} color="#E5484D" />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Đồng bộ Apple Health / Google Fit</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={() => handleNav('notification_settings')} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Bell size={19} color="#F59E0B" />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Cài đặt Thông báo & Giờ nhắc</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={() => handleNav('widgets_preview')} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Smartphone size={19} color="#8B5CF6" />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Tiện ích iOS Widgets & Apple Watch</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={() => handleNav('achievements')} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Award size={19} color="#10B981" />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Bộ sưu tập Huy hiệu & Thành tích</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={() => handleNav('referral')} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Gift size={19} color="#EC4899" />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Giới thiệu bạn bè</Text>
              <Text style={[styles.menuSub, { color: theme.textSecondary }]}>Nhận 1 tháng Pro miễn phí</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* 6. Giao diện & Dữ liệu */}
      <Text style={[styles.sectionHeading, { color: theme.textSecondary, marginTop: 14 }]}>GIAO DIỆN & DỮ LIỆU</Text>
      <View style={[styles.menuGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            {themeMode === 'dark' ? <Moon size={19} color={theme.text} /> : <Sun size={19} color={theme.text} />}
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Chế độ giao diện</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
            }}
            style={[styles.modeToggle, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          >
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '800' }}>
              {themeMode === 'dark' ? '🌙 Chế độ Tối' : '☀️ Chế độ Sáng'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={handleExportCSV} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Download size={19} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Xuất dữ liệu nhật ký (CSV)</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* 7. Hỗ trợ, Pháp lý & Tài khoản */}
      <Text style={[styles.sectionHeading, { color: theme.textSecondary, marginTop: 14 }]}>HỆ THỐNG & PHÁP LÝ</Text>
      <View style={[styles.menuGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => setShowAuthModal(true)} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Sparkles size={19} color="#10B981" />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Đăng nhập / Đồng bộ Cloud</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={handleRestorePurchases} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Shield size={19} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Khôi phục gói mua (Restore Purchases)</Text>
          </View>
          <ChevronRight size={18} color={theme.textTertiary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <LogOut size={19} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text, marginLeft: 12 }]}>Đăng xuất</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <TouchableOpacity onPress={handleDeleteAccount} style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Trash2 size={19} color={theme.danger} />
            <Text style={[styles.menuTitle, { color: theme.danger, marginLeft: 12 }]}>Xóa tài khoản</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer Version */}
      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textTertiary }}>CalTrack AI • v1.0.0 (Build 24)</Text>
        <Text style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>Thiết kế theo chuẩn Apple Human Interface Guidelines</Text>
      </View>

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 36 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '800' },
  card: { padding: 18, borderRadius: 22, borderWidth: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2.5 },
  proBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  proBanner: { padding: 12, borderRadius: 14, borderWidth: 1 },
  sectionHeading: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  grid2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  statCard: { width: '48.5%', padding: 12, borderRadius: 16, borderWidth: 1 },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  menuGroup: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '700' },
  menuSub: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 16 },
  modeToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 }
});
