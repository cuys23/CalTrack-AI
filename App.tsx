import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Modal, ScrollView, ActivityIndicator, BackHandler, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Home, TrendingUp, Plus, User, Sparkles, Layers, X, Undo } from 'lucide-react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { I18nProvider, useTranslation } from './src/i18n';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScanScreen } from './src/screens/CameraScanScreen';
import { FoodResultScreen } from './src/screens/FoodResultScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SplashScreen, WelcomeScreen, PaywallScreen, SignInScreen } from './src/screens/onboarding/OnboardingSubScreens';
import { NutritionDetailScreen, LogMenuSheet, TextLogSheet } from './src/screens/dashboard/NutritionDetailScreen';
import { FoodSearchScreen, StreakDetailScreen, AchievementsScreen, ReferralScreen } from './src/screens/library/LibraryScreens';
import { ExerciseLogScreen, HealthSyncSettingsScreen } from './src/screens/exercise/ExerciseScreens';
import { MeasurementLogSheet, PhotoCompareScreen, WeeklyReportScreen } from './src/screens/progress/ProgressSubScreens';
import { FixResultSheet, QuickAddSheet, AddExerciseSheet } from './src/screens/scanning/ScanningSubSheets';
import { FoodDetailScreen, CreateFoodScreen, SavedMealsScreen } from './src/screens/library/RecipeAndSavedScreens';
import { NotificationSettingsScreen, WidgetsAndWatchScreen, EditGoalsScreen } from './src/screens/gamification/WidgetsAndSettingsScreens';

import { AiFoodEngine } from './src/services/aiFoodEngine';
import { apiClient, ApiError } from './src/services/apiClient';
import { FoodItem } from './src/types';
import { triggerHaptic } from './src/utils/haptics';

export type ScreenId =
  | 'home'
  | 'splash'
  | 'welcome'
  | 'onboarding'
  | 'paywall'
  | 'signin'
  | 'camera'
  | 'food_result'
  | 'nutrition_detail'
  | 'food_search'
  | 'food_detail'
  | 'create_food'
  | 'saved_meals'
  | 'progress'
  | 'measurement_log'
  | 'photo_compare'
  | 'weekly_report'
  | 'exercise'
  | 'health_sync'
  | 'streak_detail'
  | 'achievements'
  | 'notification_settings'
  | 'widgets_preview'
  | 'edit_goals'
  | 'referral'
  | 'profile';

type SheetId = 'log' | 'text' | 'quick_add' | 'add_exercise' | 'fix_result';

const ONBOARDED_KEY = 'caltrack_onboarded';

function MainApp() {
  const { theme, themeMode, addFoodLog, addExercise, foodLogs, toasts, removeToast, showToast } = useApp();
  const { t } = useTranslation();

  // Phone widths pass through untouched; only tablets hit the cap.
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth > 700;

  const [stack, setStack] = useState<ScreenId[]>(['splash']);
  const currentScreen = stack[stack.length - 1];

  const push = (screen: ScreenId) => setStack((p) => (p[p.length - 1] === screen ? p : [...p, screen]));
  const back = () => setStack((p) => (p.length > 1 ? p.slice(0, -1) : ['home']));
  const reset = (screen: ScreenId) => setStack([screen]);

  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [cameraMode, setCameraMode] = useState<'food' | 'barcode' | 'label'>('food');
  const [analyzedFood, setAnalyzedFood] = useState<FoodItem | null>(null);
  const [selectedDetailFood, setSelectedDetailFood] = useState<FoodItem | null>(null);
  const [showScreenJumper, setShowScreenJumper] = useState(false);

  // Android hardware back: close sheet, else pop the stack, else let the OS exit.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) {
        setSheet(null);
        return true;
      }
      if (stack.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [sheet, stack.length]);

  const markOnboarded = () => AsyncStorage.setItem(ONBOARDED_KEY, '1');

  const showResult = (food: FoodItem) => {
    setAnalyzedFood(food);
    setSheet(null);
    push('food_result');
  };

  const handleCapturePhoto = async (imageUri: string, isBarcode = false, imageBase64?: string) => {
    triggerHaptic('success');
    setAnalyzedFood(null);
    setStack((p) => [...p.slice(0, -1), 'food_result']); // camera -> result, camera stays off the stack

    let item: FoodItem;
    if (isBarcode || cameraMode === 'barcode') {
      // `imageUri` carries the scanned code in barcode mode. It used to be
      // discarded in favour of a hardcoded barcode, so every scan produced the
      // same product.
      const scanned = await AiFoodEngine.scanBarcode(imageUri);

      if (!scanned) {
        // Open Food Facts covers Vietnamese products thinly, so this is an
        // ordinary outcome. Offer manual entry instead of inventing a product.
        back();
        setSheet('quick_add');
        showToast('Không tìm thấy sản phẩm cho mã vạch này. Bạn có thể nhập thủ công.');
        return;
      }

      item = scanned;
    } else {
      try {
        if (!imageBase64) throw new Error('Ảnh không kèm dữ liệu để phân tích.');

        // The scan is queued server-side, so wait for the worker instead of
        // reading the still-empty meal_log that /meal/analyze returns at once.
        const mealLog = await apiClient.analyzeMealAndWait(imageBase64, 'breakfast');
        if (mealLog?.foods?.length) {
          const res = { meal_log: mealLog };
          const first = mealLog.foods[0];
          item = {
            id: String(res.meal_log.id || Date.now()),
            name: first.name,
            mealType: (res.meal_log.meal_type as any) || 'breakfast',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0],
            calories: first.calories,
            portion: 1,
            portionUnit: 'phần',
            portionGrams: first.grams,
            macros: {
              protein: first.protein_g,
              carbs: first.carbs_g,
              fat: first.fat_g,
            },
            healthScore: Math.min(10, Math.max(1, Math.round((res.meal_log.health_score || 88) / 10))),
            confidence: 'high',
            source: 'verified',
            fkbSourceLabel: 'AI Vision Server',
            imageUrl: res.meal_log.image_url || imageUri,
          };
        } else {
          item = await AiFoodEngine.analyzeImage(imageUri);
        }
      } catch (e: any) {
        // Being refused for lack of a subscription is not an offline condition.
        // Falling back here would hand a free account a fabricated result and
        // make the paywall look broken rather than enforced.
        if (e instanceof ApiError && e.isNotEntitled) {
          back();
          push('paywall');
          showToast('Quét bằng AI là tính năng của CalorieIQ Pro.');
          return;
        }

        // Genuinely offline: fall back to the local estimate.
        item = await AiFoodEngine.analyzeImage(imageUri);
      }
    }
    setAnalyzedFood(item);
  };

  const handleSaveAnalyzedFood = (food: FoodItem) => {
    addFoodLog(food);
    setAnalyzedFood(null);
    reset('home');
  };

  const openFoodDetail = (food: FoodItem) => {
    setSelectedDetailFood(food);
    push('food_detail');
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <SplashScreen
            onFinish={async () => {
              const done = await AsyncStorage.getItem(ONBOARDED_KEY);
              reset(done ? 'home' : 'welcome');
            }}
          />
        );
      case 'welcome':
        return <WelcomeScreen onStart={() => push('onboarding')} onSignIn={() => push('signin')} />;
      case 'onboarding':
        return (
          <OnboardingScreen
            onFinish={() => {
              markOnboarded();
              // Re-run from Profile returns there; first run continues to the paywall.
              if (stack.includes('profile')) back();
              else push('paywall');
            }}
          />
        );
      case 'paywall':
        return (
          <PaywallScreen
            onClose={() => {
              if (stack.includes('welcome') || stack.includes('onboarding')) push('signin');
              else reset('home');
            }}
            onUnlock={() => {
              if (stack.includes('welcome') || stack.includes('onboarding')) push('signin');
              else reset('home');
            }}
          />
        );
      case 'signin':
        return (
          <SignInScreen
            onComplete={() => {
              markOnboarded();
              reset('home');
            }}
            onBack={back}
          />
        );
      case 'home':
        return (
          <HomeScreen
            onOpenScan={() => setSheet('log')}
            onOpenProgress={() => reset('progress')}
            onOpenProfile={() => reset('profile')}
            onOpenNutritionDetail={() => push('nutrition_detail')}
            onOpenStreak={() => push('streak_detail')}
            onOpenExercise={() => push('exercise')}
            onSelectFood={openFoodDetail}
          />
        );
      case 'camera':
        return <CameraScanScreen onCapture={handleCapturePhoto} onClose={back} />;
      case 'food_result':
        if (!analyzedFood) {
          return (
            <View style={[styles.loading, { backgroundColor: theme.bg }]}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={{ marginTop: 12, color: theme.textSecondary, fontWeight: '700' }}>
                AI đang phân tích món ăn...
              </Text>
            </View>
          );
        }
        return (
          <FoodResultScreen
            foodItem={analyzedFood}
            onSave={handleSaveAnalyzedFood}
            onFix={() => setSheet('fix_result')}
            onClose={() => {
              setAnalyzedFood(null);
              back();
            }}
          />
        );
      case 'nutrition_detail':
        return <NutritionDetailScreen onBack={back} />;
      case 'food_search':
        return (
          <FoodSearchScreen
            onSelectFood={openFoodDetail}
            onCreateFood={() => push('create_food')}
            onBack={back}
          />
        );
      case 'food_detail':
        return (
          <FoodDetailScreen
            food={selectedDetailFood || (foodLogs.length > 0 ? foodLogs[0] : {
              id: 'sample-food',
              name: 'Món ăn mẫu',
              mealType: 'lunch',
              time: '12:00',
              date: new Date().toISOString().split('T')[0],
              calories: 450,
              portion: 1,
              portionUnit: 'phần',
              macros: { protein: 24, carbs: 48, fat: 12 },
              healthScore: 8,
              confidence: 'high'
            })}
            onSave={() => {
              if (selectedDetailFood) addFoodLog(selectedDetailFood);
              back();
            }}
            onBack={back}
          />
        );
      case 'create_food':
        return (
          <CreateFoodScreen
            onCreated={(food) => {
              addFoodLog(food);
              back();
            }}
            onBack={back}
          />
        );
      case 'saved_meals':
        return <SavedMealsScreen onSelectFood={openFoodDetail} onBack={back} />;
      case 'progress':
        return (
          <ProgressScreen
            onBack={back}
            onOpenCompare={() => push('photo_compare')}
            onOpenWeeklyReport={() => push('weekly_report')}
            onOpenMeasurements={() => push('measurement_log')}
          />
        );
      case 'measurement_log':
        return <MeasurementLogSheet onSave={back} onClose={back} />;
      case 'photo_compare':
        return <PhotoCompareScreen onBack={back} />;
      case 'weekly_report':
        return <WeeklyReportScreen onBack={back} />;
      case 'exercise':
        return (
          <ExerciseLogScreen
            onBack={back}
            onOpenAdd={() => setSheet('add_exercise')}
            onOpenSettings={() => push('health_sync')}
          />
        );
      case 'health_sync':
        return <HealthSyncSettingsScreen onBack={back} />;
      case 'streak_detail':
        return <StreakDetailScreen onBack={back} />;
      case 'achievements':
        return <AchievementsScreen onBack={back} />;
      case 'notification_settings':
        return <NotificationSettingsScreen onBack={back} />;
      case 'widgets_preview':
        return <WidgetsAndWatchScreen onBack={back} />;
      case 'edit_goals':
        return <EditGoalsScreen onBack={back} />;
      case 'referral':
        return <ReferralScreen onBack={back} />;
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => reset('home')}
            onNavigate={(screen) => push(screen as ScreenId)}
            onAccountDeleted={async () => {
              await AsyncStorage.removeItem(ONBOARDED_KEY);
              reset('welcome');
            }}
          />
        );
    }
  };

  const renderSheet = () => {
    switch (sheet) {
      case 'log':
        return (
          <LogMenuSheet
            onSelectCamera={(mode) => {
              setSheet(null);
              setCameraMode(mode);
              push('camera');
            }}
            onSelectText={() => setSheet('text')}
            onSelectSearch={() => {
              setSheet(null);
              push('food_search');
            }}
            onSelectSaved={() => {
              setSheet(null);
              push('saved_meals');
            }}
            onSelectQuickAdd={() => setSheet('quick_add')}
            onClose={() => setSheet(null)}
          />
        );
      case 'text':
        return <TextLogSheet onResult={showResult} onClose={() => setSheet(null)} />;
      case 'quick_add':
        return <QuickAddSheet onSave={addFoodLog} onClose={() => setSheet(null)} />;
      case 'add_exercise':
        return (
          <AddExerciseSheet
            onAdd={(ex) => {
              addExercise(ex);
              triggerHaptic('success');
            }}
            onClose={() => setSheet(null)}
          />
        );
      case 'fix_result':
        return analyzedFood ? (
          <FixResultSheet foodItem={analyzedFood} onRefine={setAnalyzedFood} onClose={() => setSheet(null)} />
        ) : null;
      default:
        return null;
    }
  };

  // Camera & result are drawn edge-to-edge: no safe-area padding, no tab bar.
  const immersive = currentScreen === 'camera' || currentScreen === 'food_result';
  const showBottomTabBar = ['home', 'progress', 'food_search', 'profile', 'saved_meals'].includes(currentScreen);

  const renderTab = (screen: ScreenId, Icon: typeof Home, label: string) => (
    <TouchableOpacity
      onPress={() => {
        triggerHaptic('light');
        reset(screen);
      }}
      style={styles.tabBtn}
    >
      <Icon size={22} color={currentScreen === screen ? theme.accent : theme.textTertiary} />
      <Text style={[styles.tabLabel, { color: currentScreen === screen ? theme.accent : theme.textTertiary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg }]}
      edges={immersive ? [] : ['top', 'left', 'right', 'bottom']}
    >
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Floating Developer Screen Jumper Button */}
      {__DEV__ && (
        <TouchableOpacity
          onPress={() => setShowScreenJumper(true)}
          style={[styles.floatingJumper, { backgroundColor: theme.accent }]}
        >
          <Layers size={18} color={theme.accentFg} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accentFg, marginLeft: 4 }}>Xem 48 màn</Text>
        </TouchableOpacity>
      )}

      {/*
        Screen Render.

        Every screen is laid out for phone widths, with no breakpoints anywhere
        in src/. On a tablet that stretches rows and buttons across the full
        width, which reads as an unfinished port. Capping the content column and
        centring it fixes that everywhere at once, instead of adding breakpoints
        to forty-odd screens.

        ponytail: one global cap, no per-screen tablet layouts. Give a specific
        screen a real two-column treatment only if it earns it.
      */}
      <View style={styles.contentOuter}>
        <View
          style={[
            styles.contentColumn,
            // The camera fills the screen by design; capping it would letterbox
            // the viewfinder.
            isTablet && currentScreen !== 'camera' && { maxWidth: 620 },
          ]}
        >
          {renderActiveScreen()}
        </View>
      </View>

      {/* Floating Toast Notification Bar with Undo */}
      {toasts.length > 0 && (
        <View style={styles.toastWrapper}>
          {toasts.map((toast) => (
            <View
              key={toast.id}
              style={[
                styles.toastCard,
                { backgroundColor: theme.surface, borderColor: theme.border }
              ]}
            >
              <Text style={[styles.toastText, { color: theme.text }]} numberOfLines={2}>
                {toast.message}
              </Text>
              {toast.undoAction && (
                <TouchableOpacity
                  onPress={() => {
                    toast.undoAction?.();
                    removeToast(toast.id);
                  }}
                  style={[styles.undoBtn, { backgroundColor: theme.accent }]}
                >
                  <Undo size={14} color={theme.accentFg} />
                  <Text style={{ color: theme.accentFg, fontSize: 12, fontWeight: '800', marginLeft: 4 }}>Hoàn tác</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Bottom Tab Bar */}
      {showBottomTabBar && (
        <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {renderTab('home', Home, 'Trang chủ')}
          {renderTab('progress', TrendingUp, 'Tiến trình')}

          {/* Floating Center Plus Action Button */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('heavy');
                setSheet('log');
              }}
              style={[styles.centerPlus, { backgroundColor: theme.accent }]}
            >
              <Plus size={26} color={theme.accentFg} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          {renderTab('food_search', Sparkles, 'Thư viện')}
          {renderTab('profile', User, 'Cá nhân')}
        </View>
      )}

      {/* Bottom sheets — one Modal, swapped content: avoids the iOS modal-over-modal race. */}
      <Modal
        visible={sheet !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSheet(null)}
      >
        <View style={styles.modalBackdrop}>{renderSheet()}</View>
      </Modal>

      {/* Screen Jumper / Selector Modal */}
      <Modal visible={showScreenJumper} animationType="fade" transparent onRequestClose={() => setShowScreenJumper(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.jumperModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>Chọn màn hình muốn xem (Đủ 48 màn)</Text>
              <TouchableOpacity onPress={() => setShowScreenJumper(false)}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              {[
                { id: 'home', label: '3.1 Trang chủ (Dashboard)' },
                { id: 'nutrition_detail', label: '3.2 Chi tiết Dinh dưỡng & Vi chất' },
                { id: 'food_search', label: '2.8 Tìm kiếm món ăn' },
                { id: 'food_detail', label: '2.9 Chi tiết món ăn' },
                { id: 'create_food', label: '2.10 Tạo món ăn mới' },
                { id: 'saved_meals', label: '2.11 Món ăn đã lưu' },
                { id: 'progress', label: '4.1 Tiến trình & Cân nặng' },
                { id: 'measurement_log', label: '4.4 Số đo cơ thể' },
                { id: 'photo_compare', label: '4.3 So sánh ảnh Trước / Sau' },
                { id: 'weekly_report', label: '4.5 Báo cáo tuần dạng Story' },
                { id: 'exercise', label: '5.1 Vận động & Calo đốt' },
                { id: 'health_sync', label: '5.3 Cài đặt Apple Health Sync' },
                { id: 'streak_detail', label: '6.1 Chi tiết Streak 🔥' },
                { id: 'achievements', label: '6.2 Huy hiệu & Thành tích' },
                { id: 'notification_settings', label: '6.3 Cài đặt thông báo' },
                { id: 'widgets_preview', label: '6.4 & 6.5 Widgets & Apple Watch' },
                { id: 'edit_goals', label: '1.19 Chỉnh mục tiêu Calo & Macro' },
                { id: 'referral', label: '7.2 Giới thiệu bạn bè' },
                { id: 'profile', label: '7.1 Cá nhân & Cài đặt' },
                { id: 'onboarding', label: '1.3-1.16 Khảo sát Onboarding' },
                { id: 'paywall', label: '1.17 Màn hình Paywall Pro' },
                { id: 'welcome', label: '1.2 Màn hình Welcome' },
                { id: 'splash', label: '1.1 Màn hình Splash' },
                { id: 'signin', label: '1.18 Đăng nhập' }
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    triggerHaptic('light');
                    push(s.id as ScreenId);
                    setShowScreenJumper(false);
                  }}
                  style={[
                    styles.jumperItem,
                    {
                      backgroundColor: currentScreen === s.id ? theme.accent : theme.surfaceAlt,
                      borderColor: theme.border
                    }
                  ]}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: currentScreen === s.id ? theme.accentFg : theme.text }}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  contentOuter: { flex: 1, alignItems: 'center' },
  contentColumn: { flex: 1, width: '100%' },
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floatingJumper: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  toastWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 1000,
    gap: 8
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  toastText: { fontSize: 13, fontWeight: '700', flex: 1 },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 10
  },
  tabBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingHorizontal: 8
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontSize: 10, fontWeight: '700' },
  centerPlus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -10 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  jumperModal: { margin: 20, marginBottom: 40, padding: 20, borderRadius: 24, borderWidth: 1 },
  jumperItem: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 6 }
});
