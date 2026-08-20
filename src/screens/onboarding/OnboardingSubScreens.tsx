import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import {
  useIAP,
  finishTransaction,
  getAvailablePurchases,
  ErrorCode,
  type Purchase,
} from 'expo-iap';
import { ChevronLeft, Lock, Shield, Smartphone, RefreshCw, X, ArrowRight, Check } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { CalorieRing } from '../../components/CalorieRing';
import { triggerHaptic } from '../../utils/haptics';
import { apiClient } from '../../services/apiClient';
import { LEGAL_URLS } from '../../constants/legal';
import { useTranslation, useTArray } from '../../i18n';
import {
  signInWithApple,
  signInWithGoogle,
  applyAuthResult,
  wasCanceled,
} from '../../services/socialAuth';

// 1.1 Splash Screen
export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const { theme } = useApp();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(onFinish, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
      <View style={[styles.splashLogo, { backgroundColor: 'rgba(255, 107, 53, 0.14)', borderColor: 'rgba(255, 107, 53, 0.24)' }]}>
        <Text style={{ fontSize: 44 }}>🍲</Text>
      </View>
      <Text style={[styles.splashTitle, { color: theme.text }]}>CalorieIQ</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
        {t('splash.tagline')}
      </Text>
    </View>
  );
};

// 1.2 Welcome Screen
export const WelcomeScreen: React.FC<{ onStart: () => void; onSignIn: () => void }> = ({ onStart, onSignIn }) => {
  const { theme } = useApp();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Hero Glowing Calorie Visual */}
      <View style={[styles.welcomeHeroBox, { backgroundColor: '#000000' }]}>
        <View style={styles.radialGlow} />

        <View style={styles.welcomeRingWrapper}>
          <CalorieRing size={160} target={2000} consumed={760} showSubText={false} />
          <View style={styles.welcomeRingCenter}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: theme.text, letterSpacing: -1 }}>1240</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary }}>kcal còn lại</Text>
          </View>
        </View>

        {/* 3 Macro Chips */}
        <View style={styles.macroPillsRow}>
          <View style={[styles.macroPill, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <View style={[styles.pillDot, { backgroundColor: '#E5484D' }]} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>128g</Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <View style={[styles.pillDot, { backgroundColor: '#F5A524' }]} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>210g</Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <View style={[styles.pillDot, { backgroundColor: '#3E7BFA' }]} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>62g</Text>
          </View>
        </View>
      </View>

      {/* Bottom Content Area */}
      <View style={[styles.welcomeContent, { backgroundColor: theme.bg }]}>
        <Text style={[styles.welcomeHeadline, { color: theme.text }]}>
          Theo dõi calo thông minh{'\n'}chỉ với 1 tấm ảnh
        </Text>
        <Text style={[styles.welcomeSub, { color: theme.textSecondary }]}>
          AI nhận diện món ăn Việt & quốc tế chỉ trong vài giây
        </Text>

        <View style={{ flex: 1, minHeight: 16 }} />

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('medium');
            onStart();
          }}
          activeOpacity={0.88}
          style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
        >
          <Text style={{ color: theme.accentFg, fontSize: 16, fontWeight: '800' }}>Bắt đầu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            onSignIn();
          }}
          style={{ paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '700' }}>Tôi đã có tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 1.17 Paywall Screen v2 (with personalized plan & 3-step timeline)
const PRODUCT_IDS = {
  yearly: 'com.vin.calorielq.yearly_pro',
  monthly: 'com.vin.calorielq.monthly_pro',
  lifetime: 'com.vin.calorielq.lifetime_pro',
} as const;

const SUBSCRIPTION_IDS = [PRODUCT_IDS.yearly, PRODUCT_IDS.monthly];

export const PaywallScreen: React.FC<{ onClose: () => void; onUnlock: () => void }> = ({ onClose, onUnlock }) => {
  const { theme, themeMode, showToast, setIsPremium, userGoals, userProfile } = useApp();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [loading, setLoading] = useState(false);

  const redeem = async (purchase: Purchase): Promise<boolean> => {
    const jws = purchase.purchaseToken;
    if (!jws) {
      showToast(t('paywall.noReceipt'));
      return false;
    }

    const res = await apiClient.verifyIapPurchase(jws);
    if (!res.is_premium) return false;

    setIsPremium(true);
    await finishTransaction({ purchase, isConsumable: false });
    return true;
  };

  const { connected, requestPurchase } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        if (await redeem(purchase)) {
          triggerHaptic('success');
          showToast(t('paywall.unlockSuccess'));
          onUnlock();
        } else {
          triggerHaptic('error');
          showToast(t('paywall.verifyFailed'));
        }
      } catch (e: any) {
        triggerHaptic('error');
        showToast(e?.message || t('paywall.verifyFailed'));
      } finally {
        setLoading(false);
      }
    },
    onPurchaseError: (error) => {
      setLoading(false);
      if (error.code !== ErrorCode.UserCancelled) {
        triggerHaptic('error');
        showToast(error.message || t('paywall.transactionFailed'));
      }
    },
  });

  const handlePurchase = async () => {
    if (!connected) {
      showToast(t('paywall.notConnected'));
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    const sku = PRODUCT_IDS[selectedPlan];
    const isSubscription = SUBSCRIPTION_IDS.includes(sku as any);

    requestPurchase({
      request: { apple: { sku }, google: { skus: [sku] } },
      type: isSubscription ? 'subs' : 'in-app',
    });
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      triggerHaptic('light');

      const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      const tokens = purchases.map((p) => p.purchaseToken).filter(Boolean) as string[];

      if (tokens.length === 0) {
        showToast(t('paywall.noRestore'));
        return;
      }

      const res = await apiClient.restoreIapPurchases(tokens);
      if (res.is_premium) {
        setIsPremium(true);
        triggerHaptic('success');
        showToast(t('paywall.restoreSuccess'));
        onClose();
      } else {
        showToast(t('paywall.noActiveRestore'));
      }
    } catch (e: any) {
      showToast(e?.message || t('paywall.restoreFailed'));
    } finally {
      setLoading(false);
    }
  };

  const planTargetKcal = userGoals?.targetCalories || 1850;
  const targetWeight = userProfile?.targetWeightKg || userGoals?.targetWeight || 55;
  const targetDateStr = userGoals?.targetDate || '12/11/2026';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 60 }}>
      {/* Header with Restore & Close */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={handleRestore} style={{ padding: 6 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>{t('paywall.restore')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={[styles.closeCircle, { backgroundColor: theme.surfaceAlt }]}>
          <X size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 1. Personalized Plan Hero Banner */}
      <View style={[styles.paywallPlanHero, { backgroundColor: 'rgba(255, 107, 53, 0.12)', borderColor: 'rgba(255, 107, 53, 0.3)' }]}>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#FF6B35' }}>KẾ HOẠCH CỦA BẠN</Text>
        <Text style={[styles.paywallHeadline, { color: theme.text }]}>
          Mục tiêu {targetWeight} kg vào {targetDateStr}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={[styles.heroPill, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)', borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>{planTargetKcal} kcal/ngày</Text>
          </View>
          <View style={[styles.heroPill, { backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.75)', borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text }}>
              {userGoals?.targetProtein || 120}P · {userGoals?.targetCarbs || 190}C · {userGoals?.targetFat || 50}F
            </Text>
          </View>
        </View>
      </View>

      {/* 2. 3-Step Free Trial Timeline */}
      <View style={[styles.timelineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: '#FF6B35' }]} />
          <View style={styles.timelineTextCol}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Hôm nay</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Mở khóa scan AI không giới hạn</Text>
          </View>
        </View>

        <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: '#F5A524' }]} />
          <View style={styles.timelineTextCol}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Ngày 5</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Nhắc bạn 2 ngày trước khi dùng thử kết thúc</Text>
          </View>
        </View>

        <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: '#22C55E' }]} />
          <View style={styles.timelineTextCol}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Ngày 7</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Bắt đầu tính phí, có thể hủy bất cứ lúc nào</Text>
          </View>
        </View>
      </View>

      {/* 3. Segmented Plan Switcher */}
      <View style={[styles.segmentedRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        {[
          { id: 'yearly', title: 'Hàng năm', price: '$2.49/th', save: 'TIẾT KIỆM 50%' },
          { id: 'monthly', title: 'Hàng tháng', price: '$4.99/th' },
          { id: 'lifetime', title: 'Trọn đời', price: '1 lần' }
        ].map((p) => {
          const isSelected = selectedPlan === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => {
                triggerHaptic('light');
                setSelectedPlan(p.id as any);
              }}
              style={[
                styles.planSegment,
                isSelected && { backgroundColor: theme.surface, borderColor: '#FF6B35', borderWidth: 1 }
              ]}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? theme.text : theme.textSecondary }}>
                {p.title}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? '#FF6B35' : theme.textTertiary, marginTop: 2 }}>
                {p.price}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginVertical: 10 }}>
        {selectedPlan === 'yearly'
          ? '$29.99 / năm (chỉ $2.49/tháng) • Tiết kiệm 50%'
          : selectedPlan === 'monthly'
          ? '$4.99 / tháng • Gia hạn linh hoạt'
          : '$79.99 thanh toán một lần duy nhất'}
      </Text>

      {/* CTA Button */}
      <TouchableOpacity
        onPress={handlePurchase}
        disabled={loading}
        activeOpacity={0.88}
        style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 10 }]}
      >
        <Text style={{ color: theme.accentFg, fontSize: 16, fontWeight: '800' }}>
          {loading ? t('paywall.activating') : 'Dùng thử 7 ngày miễn phí'}
        </Text>
      </TouchableOpacity>

      {/* Apple Compliance Note */}
      <Text style={{ fontSize: 11, lineHeight: 16, color: theme.textTertiary, marginTop: 14, textAlign: 'center' }}>
        {t('paywall.legalNote')}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 }}>
        <TouchableOpacity onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, textDecorationLine: 'underline' }}>
            {t('paywall.terms')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, textDecorationLine: 'underline' }}>
            {t('paywall.privacy')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onClose} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text style={{ color: theme.textTertiary, fontSize: 13, fontWeight: '700' }}>Tiếp tục với bản miễn phí</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 1.18 Sign In Screen v2 (with plan security card and multi-device sync)
export const SignInScreen: React.FC<{ onComplete: () => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const { theme, showToast, setUserProfile, setUserGoals, setIsPremium, userGoals } = useApp();
  const { t } = useTranslation();
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
      showToast(t('signin.loginSuccess', { provider: label }));
      onComplete();
    } catch (e: any) {
      triggerHaptic('error');
      showToast(e.message || t('signin.loginFailed', { provider: label }), 'error');
    } finally {
      setLoadingType(null);
    }
  };

  const handleAppleLogin = () => runSignIn('apple', 'Apple', signInWithApple);
  const handleGoogleLogin = () => runSignIn('google', 'Google', signInWithGoogle);

  const planKcal = userGoals?.targetCalories || 1850;
  const macroSummary = `${userGoals?.targetProtein || 120}P · ${userGoals?.targetCarbs || 190}C · ${userGoals?.targetFat || 50}F`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg, padding: 20 }]}>
      <TouchableOpacity onPress={onBack} style={{ marginTop: 30, marginBottom: 16 }}>
        <ChevronLeft size={24} color={theme.text} />
      </TouchableOpacity>

      {/* Lock Icon Box */}
      <View style={[styles.lockIconBox, { backgroundColor: 'rgba(255, 107, 53, 0.14)', borderColor: 'rgba(255, 107, 53, 0.26)' }]}>
        <Lock size={22} color="#FF6B35" />
      </View>

      <Text style={[styles.h1, { color: theme.text, marginTop: 12 }]}>
        Giữ kế hoạch này an toàn
      </Text>
      <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
        Tạo tài khoản để kế hoạch và nhật ký của bạn không bị mất khi đổi máy.
      </Text>

      {/* Plan Snapshot Card (Unsaved indicator) */}
      <View style={[styles.planSnapshotCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 20 }]}>
        <View style={styles.snapshotCircle}>
          <CalorieRing size={46} target={planKcal} consumed={0} showSubText={false} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>{planKcal} kcal / ngày</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>{macroSummary} · sẵn sàng lưu</Text>
        </View>
        <View style={[styles.unsavedBadge, { backgroundColor: 'rgba(34, 197, 94, 0.14)' }]}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#22C55E' }}>CHƯA LƯU</Text>
        </View>
      </View>

      {/* 3 Value Propositions */}
      <View style={{ gap: 14, marginVertical: 24 }}>
        <View style={styles.valueRow}>
          <View style={[styles.valueIconBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Smartphone size={16} color={theme.text} />
          </View>
          <Text style={[styles.valueText, { color: theme.text }]}>
            Đồng bộ iPhone, iPad và Web trong thời gian thực
          </Text>
        </View>

        <View style={styles.valueRow}>
          <View style={[styles.valueIconBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <RefreshCw size={16} color={theme.text} />
          </View>
          <Text style={[styles.valueText, { color: theme.text }]}>
            Khôi phục toàn bộ nhật ký và ảnh món ăn khi đổi máy
          </Text>
        </View>

        <View style={styles.valueRow}>
          <View style={[styles.valueIconBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Shield size={16} color={theme.text} />
          </View>
          <Text style={[styles.valueText, { color: theme.text }]}>
            Bảo mật tuyệt đối, không chia sẻ hay bán dữ liệu
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 12, paddingBottom: 40, marginTop: 8 }}>
        <TouchableOpacity
          onPress={handleAppleLogin}
          disabled={loadingType !== null}
          activeOpacity={0.88}
          style={[styles.socialBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
        >
          <Text style={{ color: theme.accentFg, fontSize: 16, fontWeight: '800' }}>
            {loadingType === 'apple' ? t('signin.authenticating') : '  Tiếp tục với Apple'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loadingType !== null}
          activeOpacity={0.88}
          style={[styles.socialBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>
            {loadingType === 'google' ? t('signin.authenticating') : '🌐  Tiếp tục với Google'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textTertiary, letterSpacing: 0.8 }}>HOẶC</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        </View>

        {/* Guest Button */}
        <TouchableOpacity
          onPress={onComplete}
          activeOpacity={0.85}
          style={[styles.guestBtn, { backgroundColor: theme.surfaceAlt }]}
        >
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
            Dùng thử không cần tài khoản
          </Text>
          <ArrowRight size={16} color={theme.text} />
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={{ fontSize: 11, fontWeight: '500', color: theme.textTertiary, lineHeight: 16, textAlign: 'center', marginTop: 4 }}>
          Khi tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của CalorieIQ.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 90, height: 90, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  splashTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  welcomeHeroBox: { width: '100%', height: '52%', position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  radialGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255, 107, 53, 0.18)' },
  welcomeRingWrapper: { position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  welcomeRingCenter: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  macroPillsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  macroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  welcomeContent: { flex: 1, padding: 24, paddingBottom: 40, justifyContent: 'flex-end', gap: 10 },
  welcomeHeadline: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8, lineHeight: 36 },
  welcomeSub: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  h1: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  btnPrimary: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  paywallPlanHero: { padding: 18, borderRadius: 20, borderWidth: 1, gap: 10 },
  paywallHeadline: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  heroPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  timelineCard: { padding: 18, borderRadius: 20, borderWidth: 1, marginVertical: 14, gap: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { width: 2, height: 20, marginLeft: 4, marginVertical: 2 },
  timelineTextCol: { flex: 1 },
  segmentedRow: { flexDirection: 'row', padding: 4, borderRadius: 16, borderWidth: 1, gap: 4 },
  planSegment: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  lockIconBox: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  planSnapshotCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  snapshotCircle: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  unsavedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  valueIconBox: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  valueText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  socialBtn: { height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  guestBtn: { height: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }
});
