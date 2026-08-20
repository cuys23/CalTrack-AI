import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput } from 'react-native';
import { ChevronLeft, Sparkles, Check, Crown, Shield, Apple } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { RulerPicker } from '../../components/RulerPicker';
import { CalorieRing, MacroRing } from '../../components/CalorieRing';
import { triggerHaptic } from '../../utils/haptics';
import { apiClient } from '../../services/apiClient';
import { isAppleSignInSupported, signInWithApple } from '../../services/appleAuth';
import { signInWithGoogle } from '../../services/googleAuth';
import { useIAP, getAvailablePurchases, ErrorCode } from 'expo-iap';

// 1.1 Splash Screen
export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const { theme } = useApp();

  useEffect(() => {
    const timer = setTimeout(onFinish, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
      <View style={styles.splashLogo}>
        <Text style={{ fontSize: 44 }}>🍲</Text>
      </View>
      <Text style={[styles.splashTitle, { color: theme.text }]}>CalTrack AI</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
        Đếm calo & dinh dưỡng thông minh
      </Text>
    </View>
  );
};

// 1.2 Welcome Screen
export const WelcomeScreen: React.FC<{ onStart: () => void; onSignIn: () => void }> = ({ onStart, onSignIn }) => {
  const { theme } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80' }}
        style={styles.welcomeHero}
      />
      <View style={[styles.welcomeContent, { backgroundColor: theme.bg }]}>
        <Text style={[styles.h1, { color: theme.text, textAlign: 'center' }]}>
          Đếm calo chỉ bằng{'\n'}một tấm ảnh
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 15, marginVertical: 12 }}>
          Chụp ảnh món ăn, AI tự động nhận diện nguyên liệu, tính calo và theo dõi mục tiêu của bạn.
        </Text>

        <TouchableOpacity onPress={onStart} style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 16 }]}>
          <Text style={{ color: theme.accentFg, fontSize: 16, fontWeight: '800' }}>Bắt đầu ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSignIn} style={{ padding: 14, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '700' }}>Tôi đã có tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 1.17 Paywall Screen
const PLAN_SKUS = {
  yearly: 'com.vin.calorielq.yearly_pro',
  monthly: 'com.vin.calorielq.monthly_pro',
} as const;

type PlanId = keyof typeof PLAN_SKUS;

export const PaywallScreen: React.FC<{ onClose: () => void; onUnlock: () => void }> = ({ onClose, onUnlock }) => {
  const { theme, showToast, setIsPremium } = useApp() as any;
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [loading, setLoading] = useState(false);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        // iOS hands us the StoreKit 2 JWS here; the backend is what decides
        // whether it is real, so never unlock on the client's say-so.
        const jws = purchase.purchaseToken;
        if (!jws) throw new Error('Apple không trả về mã giao dịch.');

        const res = await apiClient.verifyIapPurchase(jws);
        if (!res.is_premium) throw new Error('Giao dịch chưa được xác nhận.');

        await finishTransaction({ purchase, isConsumable: false });

        if (setIsPremium) setIsPremium(true);
        triggerHaptic('success');
        showToast('Chúc mừng! Bạn đã mở khoá CalTrack Pro thành công!');
        onUnlock();
      } catch (e: any) {
        triggerHaptic('error');
        showToast(e.message || 'Không xác thực được giao dịch.', 'error');
      } finally {
        setLoading(false);
      }
    },
    onPurchaseError: (error) => {
      setLoading(false);
      if (error.code === ErrorCode.UserCancelled) return;
      triggerHaptic('error');
      showToast(error.message || 'Thanh toán thất bại.', 'error');
    },
    onError: (error) => {
      setLoading(false);
      showToast(error.message || 'Không kết nối được App Store.', 'error');
    },
  });

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: Object.values(PLAN_SKUS), type: 'subs' });
  }, [connected, fetchProducts]);

  // App Store review requires showing the store's own localised price.
  const priceOf = (plan: PlanId) =>
    subscriptions.find((s) => s.id === PLAN_SKUS[plan])?.displayPrice;

  const handlePurchase = () => {
    if (!connected) {
      showToast('Chưa kết nối được App Store, thử lại sau.', 'error');
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    // Resolves via onPurchaseSuccess / onPurchaseError, not by awaiting here.
    requestPurchase({
      request: {
        apple: { sku: PLAN_SKUS[selectedPlan] },
        google: { skus: [PLAN_SKUS[selectedPlan]] },
      },
      type: 'subs',
    });
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      triggerHaptic('light');

      const purchases = await getAvailablePurchases();
      const tokens = purchases.map((p) => p.purchaseToken).filter(Boolean) as string[];

      const res = await apiClient.restoreIapPurchases(tokens);
      if (res.is_premium) {
        if (setIsPremium) setIsPremium(true);
        triggerHaptic('success');
        showToast('Khôi phục gói mua thành công!');
        onClose();
      } else {
        showToast('Không tìm thấy giao dịch nào trước đó để khôi phục.');
      }
    } catch (e) {
      showToast('Không tìm thấy giao dịch nào trước đó để khôi phục.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 30 }}>
        <TouchableOpacity onPress={handleRestore} disabled={loading} style={{ padding: 8 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>Khôi phục (Restore)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '800' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <View style={styles.proCrown}>
          <Crown size={32} color="#10B981" />
        </View>
        <Text style={[styles.h1, { color: theme.text, textAlign: 'center', marginTop: 12 }]}>
          Mở khoá CalTrack AI Pro
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 14, marginTop: 6 }}>
          Quét không giới hạn và nhận diện 99.8% món ăn chuẩn xác
        </Text>
      </View>

      {/* Pro Features */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginVertical: 20 }]}>
        {[
          'Quét món ăn không giới hạn bằng Camera AI',
          'Nhận diện toàn bộ vi chất (Chất xơ, Natri, Đường)',
          'Phân tích đồ uống & quét mã vạch tức thì',
          'Đồng bộ 2 chiều Apple Health / Cloud Sync',
          'Kế hoạch macro cá nhân hoá theo y khoa'
        ].map((feat, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: i < 4 ? 12 : 0 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color={theme.success} />
            </View>
            <Text style={{ fontSize: 14, color: theme.text, flex: 1, fontWeight: '600' }}>{feat}</Text>
          </View>
        ))}
      </View>

      {/* Plan Options */}
      <TouchableOpacity
        onPress={() => { triggerHaptic('light'); setSelectedPlan('yearly'); }}
        style={[
          styles.planCard,
          {
            backgroundColor: selectedPlan === 'yearly' ? 'rgba(16, 185, 129, 0.12)' : theme.surface,
            borderColor: selectedPlan === 'yearly' ? '#10B981' : theme.border
          }
        ]}
      >
        <View style={{ position: 'absolute', top: -10, right: 14, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>TIẾT KIỆM 50%</Text>
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Gói 1 Năm (Khuyên dùng)</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            {priceOf('yearly') ? `${priceOf('yearly')} / năm` : 'Đang tải giá...'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => { triggerHaptic('light'); setSelectedPlan('monthly'); }}
        style={[
          styles.planCard,
          {
            backgroundColor: selectedPlan === 'monthly' ? 'rgba(16, 185, 129, 0.12)' : theme.surface,
            borderColor: selectedPlan === 'monthly' ? '#10B981' : theme.border,
            marginTop: 10
          }
        ]}
      >
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Gói 1 Tháng</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            {priceOf('monthly') ? `${priceOf('monthly')} / tháng` : 'Đang tải giá...'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePurchase} disabled={loading || !connected} style={[styles.btnPrimary, { backgroundColor: '#10B981', marginTop: 24, opacity: loading || !connected ? 0.6 : 1 }]}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
          {loading ? 'Đang xử lý...' : 'Bắt đầu dùng thử 7 ngày miễn phí'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 1.18 Sign In Screen
export const SignInScreen: React.FC<{ onComplete: () => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const { theme, showToast, setUserProfile, setUserGoals } = useApp();
  const [loadingType, setLoadingType] = useState<'apple' | 'google' | null>(null);

  const handleAppleLogin = async () => {
    try {
      setLoadingType('apple');
      triggerHaptic('medium');
      const res = await signInWithApple();
      if (!res) return; // user dismissed the Apple sheet

      if (res.user) {
        setUserProfile(prev => ({ ...prev, name: res.user.name || prev.name }));
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
      showToast('Đăng nhập Apple thành công!');
      onComplete();
    } catch (e: any) {
      triggerHaptic('error');
      showToast(e.message || 'Không thể đăng nhập bằng Apple.', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoadingType('google');
      triggerHaptic('medium');
      const res = await signInWithGoogle();
      if (!res) return; // user dismissed the Google picker

      if (res.user) {
        setUserProfile(prev => ({
          ...prev,
          name: res.user.name || prev.name,
          avatarUrl: res.user.avatar_url || prev.avatarUrl,
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
      showToast('Đăng nhập Google thành công!');
      onComplete();
    } catch (e: any) {
      triggerHaptic('error');
      showToast(e.message || 'Không thể đăng nhập bằng Google.', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg, padding: 20 }]}>
      <TouchableOpacity onPress={onBack} style={{ marginTop: 30, marginBottom: 20 }}>
        <ChevronLeft size={24} color={theme.text} />
      </TouchableOpacity>

      <Text style={[styles.h1, { color: theme.text }]}>
        Đăng nhập vào CalTrack AI
      </Text>
      <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 28 }}>
        Đồng bộ dữ liệu calo và tiến trình của bạn an toàn trên cloud.
      </Text>

      <View style={{ gap: 14 }}>
        {isAppleSignInSupported && (
          <TouchableOpacity
            onPress={handleAppleLogin}
            disabled={loadingType !== null}
            style={[styles.socialBtn, { backgroundColor: '#000', borderColor: '#333' }]}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {loadingType === 'apple' ? 'Đang xác thực...' : '  Tiếp tục với Apple'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loadingType !== null}
          style={[styles.socialBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>
            {loadingType === 'google' ? 'Đang xác thực...' : '🌐  Tiếp tục với Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onComplete} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: theme.textTertiary, fontSize: 13 }}>Tiếp tục với tư cách Khách</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 90, height: 90, borderRadius: 28, backgroundColor: 'rgba(255, 107, 53, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  splashTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  welcomeHero: { width: '100%', height: '55%', resizeMode: 'cover' },
  welcomeContent: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 24, justifyContent: 'center' },
  h1: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  btnPrimary: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  proCrown: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 107, 53, 0.15)', alignItems: 'center', justifyContent: 'center' },
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  planCard: { padding: 18, borderRadius: 18, borderWidth: 2, position: 'relative' },
  socialBtn: { height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inputBox: { padding: 12, borderRadius: 14, borderWidth: 1 }
});
