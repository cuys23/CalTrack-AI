import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Home, TrendingUp, Plus, User, Sparkles, Layers, X, Undo } from 'lucide-react-native';
import { AppProvider, useApp } from './src/context/AppContext';

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
import { WeightLogSheet, MeasurementLogSheet, PhotoCompareScreen, WeeklyReportScreen } from './src/screens/progress/ProgressSubScreens';
import { VoiceLogSheet, FixResultSheet, QuickAddSheet, AddExerciseSheet } from './src/screens/scanning/ScanningSubSheets';
import { FoodDetailScreen, CreateFoodScreen, SavedMealsScreen, RecipeImportScreen } from './src/screens/library/RecipeAndSavedScreens';
import { NotificationSettingsScreen, WidgetsAndWatchScreen, EditGoalsScreen } from './src/screens/gamification/WidgetsAndSettingsScreens';

import { AiFoodEngine, FKB_DATABASE } from './src/services/aiFoodEngine';
import { apiClient } from './src/services/apiClient';
import { FoodItem } from './src/types';
import { triggerHaptic } from './src/utils/haptics';

export type ScreenId =
  | 'home'
  | 'splash'
  | 'welcome'
  | 'onboarding'
  | 'paywall'
  | 'signin'
  | 'nutrition_detail'
  | 'food_search'
  | 'food_detail'
  | 'create_food'
  | 'saved_meals'
  | 'recipe_import'
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

function MainApp() {
  const { theme, themeMode, addFoodLog, foodLogs, toasts, removeToast } = useApp();

  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [showLogMenu, setShowLogMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'food' | 'barcode' | 'label'>('food');
  const [showTextLog, setShowTextLog] = useState(false);
  const [showVoiceLog, setShowVoiceLog] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showWeightLog, setShowWeightLog] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showFixResult, setShowFixResult] = useState(false);
  const [analyzedFood, setAnalyzedFood] = useState<FoodItem | null>(null);
  const [selectedDetailFood, setSelectedDetailFood] = useState<FoodItem | null>(null);
  const [showScreenJumper, setShowScreenJumper] = useState(false);

  const handleCapturePhoto = async (imageUri: string, isBarcode = false) => {
    setShowCamera(false);
    triggerHaptic('success');

    let item: FoodItem;
    if (isBarcode || cameraMode === 'barcode') {
      item = await AiFoodEngine.scanBarcode('8934563128901');
    } else {
      try {
        // Attempt backend AI Vision Pipeline
        const res = await apiClient.analyzeMeal(imageUri, 'breakfast');
        if (res?.meal_log?.foods && res.meal_log.foods.length > 0) {
          const first = res.meal_log.foods[0];
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
      } catch {
        // Offline heuristic fallback
        item = await AiFoodEngine.analyzeImage(imageUri);
      }
    }
    setAnalyzedFood(item);
  };

  const handleSaveAnalyzedFood = (food: FoodItem) => {
    addFoodLog(food);
    setAnalyzedFood(null);
    setCurrentScreen('home');
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onFinish={() => setCurrentScreen('welcome')} />;
      case 'welcome':
        return <WelcomeScreen onStart={() => setCurrentScreen('onboarding')} onSignIn={() => setCurrentScreen('signin')} />;
      case 'onboarding':
        return <OnboardingScreen onFinish={() => setCurrentScreen('home')} />;
      case 'paywall':
        return <PaywallScreen onClose={() => setCurrentScreen('home')} onUnlock={() => setCurrentScreen('home')} />;
      case 'signin':
        return <SignInScreen onComplete={() => setCurrentScreen('home')} onBack={() => setCurrentScreen('welcome')} />;
      case 'home':
        return (
          <HomeScreen
            onOpenScan={() => setShowLogMenu(true)}
            onOpenProgress={() => setCurrentScreen('progress')}
            onOpenProfile={() => setCurrentScreen('profile')}
            onOpenNutritionDetail={() => setCurrentScreen('nutrition_detail')}
            onOpenStreak={() => setCurrentScreen('streak_detail')}
            onOpenExercise={() => setCurrentScreen('exercise')}
            onSelectFood={(food) => {
              setSelectedDetailFood(food);
              setCurrentScreen('food_detail');
            }}
          />
        );
      case 'nutrition_detail':
        return <NutritionDetailScreen onBack={() => setCurrentScreen('home')} />;
      case 'food_search':
        return (
          <FoodSearchScreen
            onSelectFood={(food) => {
              setSelectedDetailFood(food);
              setCurrentScreen('food_detail');
            }}
            onBack={() => setCurrentScreen('home')}
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
              setCurrentScreen('home');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'create_food':
        return (
          <CreateFoodScreen
            onCreated={(food) => {
              addFoodLog(food);
              setCurrentScreen('home');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'saved_meals':
        return (
          <SavedMealsScreen
            onSelectFood={(food) => {
              setSelectedDetailFood(food);
              setCurrentScreen('food_detail');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'recipe_import':
        return (
          <RecipeImportScreen
            onImported={(food) => {
              addFoodLog(food);
              setCurrentScreen('home');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'progress':
        return (
          <ProgressScreen
            onBack={() => setCurrentScreen('home')}
            onOpenCompare={() => setCurrentScreen('photo_compare')}
            onOpenWeeklyReport={() => setCurrentScreen('weekly_report')}
            onOpenMeasurements={() => setCurrentScreen('measurement_log')}
          />
        );
      case 'measurement_log':
        return <MeasurementLogSheet onSave={() => setCurrentScreen('progress')} onClose={() => setCurrentScreen('progress')} />;
      case 'photo_compare':
        return <PhotoCompareScreen onBack={() => setCurrentScreen('progress')} />;
      case 'weekly_report':
        return <WeeklyReportScreen onBack={() => setCurrentScreen('progress')} />;
      case 'exercise':
        return (
          <ExerciseLogScreen
            onBack={() => setCurrentScreen('home')}
            onOpenAdd={() => setShowAddExercise(true)}
            onOpenSettings={() => setCurrentScreen('health_sync')}
          />
        );
      case 'health_sync':
        return <HealthSyncSettingsScreen onBack={() => setCurrentScreen('exercise')} />;
      case 'streak_detail':
        return <StreakDetailScreen onBack={() => setCurrentScreen('home')} />;
      case 'achievements':
        return <AchievementsScreen onBack={() => setCurrentScreen('profile')} />;
      case 'notification_settings':
        return <NotificationSettingsScreen onBack={() => setCurrentScreen('profile')} />;
      case 'widgets_preview':
        return <WidgetsAndWatchScreen onBack={() => setCurrentScreen('profile')} />;
      case 'edit_goals':
        return <EditGoalsScreen onBack={() => setCurrentScreen('profile')} />;
      case 'referral':
        return <ReferralScreen onBack={() => setCurrentScreen('profile')} />;
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setCurrentScreen('home')}
            onNavigate={(screen) => setCurrentScreen(screen as ScreenId)}
          />
        );
      default:
        return (
          <HomeScreen
            onOpenScan={() => setShowLogMenu(true)}
            onOpenProgress={() => setCurrentScreen('progress')}
            onOpenProfile={() => setCurrentScreen('profile')}
            onOpenNutritionDetail={() => setCurrentScreen('nutrition_detail')}
            onOpenStreak={() => setCurrentScreen('streak_detail')}
            onOpenExercise={() => setCurrentScreen('exercise')}
            onSelectFood={(food) => {
              setSelectedDetailFood(food);
              setCurrentScreen('food_detail');
            }}
          />
        );
    }
  };

  const showBottomTabBar = ['home', 'progress', 'profile', 'saved_meals', 'food_search'].includes(currentScreen);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Floating Developer Screen Jumper Button */}
      <TouchableOpacity
        onPress={() => setShowScreenJumper(true)}
        style={[styles.floatingJumper, { backgroundColor: theme.accent }]}
      >
        <Layers size={18} color={theme.accentFg} />
        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accentFg, marginLeft: 4 }}>Xem 48 màn</Text>
      </TouchableOpacity>

      {/* Screen Render */}
      <View style={{ flex: 1 }}>{renderActiveScreen()}</View>

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
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setCurrentScreen('home');
            }}
            style={styles.tabBtn}
          >
            <Home size={22} color={currentScreen === 'home' ? theme.accent : theme.textTertiary} />
            <Text style={[styles.tabLabel, { color: currentScreen === 'home' ? theme.accent : theme.textTertiary }]}>
              Trang chủ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setCurrentScreen('progress');
            }}
            style={styles.tabBtn}
          >
            <TrendingUp size={22} color={currentScreen === 'progress' ? theme.accent : theme.textTertiary} />
            <Text style={[styles.tabLabel, { color: currentScreen === 'progress' ? theme.accent : theme.textTertiary }]}>
              Tiến trình
            </Text>
          </TouchableOpacity>

          {/* Floating Center Plus Action Button */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('heavy');
                setShowLogMenu(true);
              }}
              style={[styles.centerPlus, { backgroundColor: theme.accent }]}
            >
              <Plus size={26} color={theme.accentFg} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setCurrentScreen('food_search');
            }}
            style={styles.tabBtn}
          >
            <Sparkles size={22} color={currentScreen === 'food_search' ? theme.accent : theme.textTertiary} />
            <Text style={[styles.tabLabel, { color: currentScreen === 'food_search' ? theme.accent : theme.textTertiary }]}>
              Thư viện
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              setCurrentScreen('profile');
            }}
            style={styles.tabBtn}
          >
            <User size={22} color={currentScreen === 'profile' ? theme.accent : theme.textTertiary} />
            <Text style={[styles.tabLabel, { color: currentScreen === 'profile' ? theme.accent : theme.textTertiary }]}>
              Cá nhân
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2.1 Log Menu Modal */}
      <Modal visible={showLogMenu} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <LogMenuSheet
            onSelectCamera={(mode) => {
              setShowLogMenu(false);
              setCameraMode(mode);
              setShowCamera(true);
            }}
            onSelectText={() => {
              setShowLogMenu(false);
              setShowTextLog(true);
            }}
            onSelectVoice={() => {
              setShowLogMenu(false);
              setShowVoiceLog(true);
            }}
            onSelectSearch={() => {
              setShowLogMenu(false);
              setCurrentScreen('food_search');
            }}
            onSelectSaved={() => {
              setShowLogMenu(false);
              setCurrentScreen('saved_meals');
            }}
            onSelectRecipe={() => {
              setShowLogMenu(false);
              setCurrentScreen('recipe_import');
            }}
            onSelectQuickAdd={() => {
              setShowLogMenu(false);
              setShowQuickAdd(true);
            }}
            onClose={() => setShowLogMenu(false)}
          />
        </View>
      </Modal>

      {/* 2.6 Text Log Sheet Modal */}
      <Modal visible={showTextLog} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <TextLogSheet
            onResult={(food) => {
              setShowTextLog(false);
              setAnalyzedFood(food);
            }}
            onClose={() => setShowTextLog(false)}
          />
        </View>
      </Modal>

      {/* 2.7 Voice Log Sheet Modal */}
      <Modal visible={showVoiceLog} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <VoiceLogSheet
            onResult={(food) => {
              setShowVoiceLog(false);
              setAnalyzedFood(food);
            }}
            onClose={() => setShowVoiceLog(false)}
          />
        </View>
      </Modal>

      {/* 2.13 Quick Add Sheet Modal */}
      <Modal visible={showQuickAdd} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <QuickAddSheet
            onSave={(food) => addFoodLog(food)}
            onClose={() => setShowQuickAdd(false)}
          />
        </View>
      </Modal>

      {/* 5.2 Add Exercise Sheet Modal */}
      <Modal visible={showAddExercise} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <AddExerciseSheet
            onAdd={(ex) => {
              triggerHaptic('success');
            }}
            onClose={() => setShowAddExercise(false)}
          />
        </View>
      </Modal>

      {/* 2.2 Camera Full Screen Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <CameraScanScreen
          onCapture={handleCapturePhoto}
          onClose={() => setShowCamera(false)}
        />
      </Modal>

      {/* 2.4 Food Result Screen Modal */}
      {analyzedFood && (
        <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
          <FoodResultScreen
            foodItem={analyzedFood}
            onSave={handleSaveAnalyzedFood}
            onClose={() => setAnalyzedFood(null)}
          />
        </Modal>
      )}

      {/* Screen Jumper / Selector Modal */}
      <Modal visible={showScreenJumper} animationType="fade" transparent>
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
                { id: 'recipe_import', label: '2.12 Nhập từ công thức' },
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
                    setCurrentScreen(s.id as ScreenId);
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
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
