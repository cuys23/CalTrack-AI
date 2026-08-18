import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeMode,
  UserProfile,
  UserGoals,
  FoodItem,
  WeightEntry,
  BodyMeasurements,
  ExerciseEntry,
  Achievement
} from '../types';
import { triggerHaptic } from '../utils/haptics';
import { LightTheme, DarkTheme, AppTheme } from '../constants/theme';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'undo' | 'info';
  undoAction?: () => void;
}

interface AppContextType {
  themeMode: ThemeMode;
  setThemeMode: (t: ThemeMode) => void;
  theme: AppTheme;
  activeTab: 'home' | 'progress' | 'saved_meals' | 'profile';
  setActiveTab: (t: 'home' | 'progress' | 'saved_meals' | 'profile') => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;

  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  userGoals: UserGoals;
  setUserGoals: React.Dispatch<React.SetStateAction<UserGoals>>;

  foodLogs: FoodItem[];
  setFoodLogs: React.Dispatch<React.SetStateAction<FoodItem[]>>;
  weightLogs: WeightEntry[];
  measurements: BodyMeasurements[];
  exercises: ExerciseEntry[];
  achievements: Achievement[];
  savedMeals: FoodItem[];

  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'error' | 'undo' | 'info', undoAction?: () => void) => void;
  removeToast: (id: string) => void;

  addFoodLog: (item: FoodItem) => void;
  updateFoodLog: (item: FoodItem) => void;
  deleteFoodLog: (id: string) => void;
  toggleFavorite: (foodId: string) => void;
  saveMeal: (food: FoodItem) => void;
  removeSavedMeal: (id: string) => void;

  addWeightLog: (weight: number, photoUrl?: string, note?: string) => void;
  addMeasurement: (measurement: Omit<BodyMeasurements, 'id' | 'date'>) => void;
  addExercise: (exercise: Omit<ExerciseEntry, 'id' | 'date'>) => void;

  calculateAndApplyPlan: (survey: {
    gender: 'female' | 'male' | 'other';
    age: number;
    heightCm: number;
    currentWeightKg: number;
    targetWeightKg: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
    goal: 'lose' | 'maintain' | 'gain';
    weeklyPace: number;
    dietType: 'standard' | 'vegetarian' | 'vegan' | 'keto';
  }) => UserGoals;

  exportDataAsCsv: () => string;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const todayStr = new Date().toISOString().split('T')[0];

const STORAGE_KEYS = {
  THEME: 'caltrack_theme_mode',
  PROFILE: 'caltrack_user_profile',
  GOALS: 'caltrack_user_goals',
  FOOD_LOGS: 'caltrack_food_logs',
  WEIGHT_LOGS: 'caltrack_weight_logs',
  MEASUREMENTS: 'caltrack_measurements',
  EXERCISES: 'caltrack_exercises',
  SAVED_MEALS: 'caltrack_saved_meals',
  ACHIEVEMENTS: 'caltrack_achievements'
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Minh Hoàng',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  gender: 'female',
  age: 24,
  heightCm: 165,
  currentWeightKg: 65.4,
  targetWeightKg: 57.0,
  activityLevel: 'moderate',
  goal: 'lose',
  dietType: 'standard',
  isPro: true,
  scanQuotaRemaining: 10,
  referralCode: 'CAL89X',
  referredCount: 3,
  streakCount: 12,
  longestStreak: 23,
  streakFreezesRemaining: 2,
  appDaysCount: 45,
  totalLoggedMeals: 142,
  totalWeightLostKg: 3.2
};

const DEFAULT_GOALS: UserGoals = {
  targetCalories: 1847,
  targetProtein: 138,
  targetCarbs: 185,
  targetFat: 51,
  currentWeight: 65.4,
  targetWeight: 57.0,
  targetDate: '2026-11-20',
  weeklyPace: 0.8,
  autoRecalculate: true
};

const INITIAL_FOOD_LOGS: FoodItem[] = [
  {
    id: 'demo-1',
    name: 'Bánh Mì Thịt Nướng Pate',
    mealType: 'breakfast',
    time: '07:45',
    date: todayStr,
    calories: 460,
    portion: 1,
    portionUnit: 'cái',
    portionGrams: 200,
    macros: { protein: 21, carbs: 54, fat: 18 },
    healthScore: 7.2,
    confidence: 'high',
    source: 'verified',
    fkbSourceLabel: 'Viện Dinh Dưỡng Quốc Gia (VN FCT)',
    imageUrl: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'demo-2',
    name: 'Salad Cá Hồi Áp Chảo Bơ',
    mealType: 'lunch',
    time: '12:30',
    date: todayStr,
    calories: 480,
    portion: 1,
    portionUnit: 'đĩa',
    portionGrams: 350,
    macros: { protein: 38, carbs: 16, fat: 29 },
    healthScore: 9.8,
    confidence: 'high',
    source: 'verified',
    fkbSourceLabel: 'USDA FoodData Central',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
  }
];

const INITIAL_WEIGHT_LOGS: WeightEntry[] = [
  { id: 'w-1', date: '2026-07-18', weight: 67.5 },
  { id: 'w-2', date: '2026-08-01', weight: 66.4 },
  { id: 'w-3', date: todayStr, weight: 65.4 }
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'Ngày đầu tiên', description: 'Ghi món ăn đầu tiên', icon: '🌟', progress: 100, target: '1 món' },
  { id: 'ach-2', title: '7 ngày kiên trì', description: 'Đạt chuỗi 7 ngày liên tiếp', icon: '🔥', progress: 100, target: '7 ngày' },
  { id: 'ach-3', title: 'Bậc thầy Protein', description: 'Đạt 130g protein trong 1 ngày', icon: '🥩', progress: 100, target: '1 ngày' },
  { id: 'ach-4', title: 'Chinh phục 30 ngày', description: 'Ghi nhật ký liên tục 1 tháng', icon: '🏆', progress: 65, target: '30 ngày' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [activeTab, setActiveTab] = useState<'home' | 'progress' | 'saved_meals' | 'profile'>('home');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [userGoals, setUserGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [foodLogs, setFoodLogs] = useState<FoodItem[]>(INITIAL_FOOD_LOGS);
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>(INITIAL_WEIGHT_LOGS);
  const [measurements, setMeasurements] = useState<BodyMeasurements[]>([
    { id: 'm-1', date: todayStr, waist: 68, hips: 94, chest: 86, arms: 26, bodyFatPercentage: 22.4 }
  ]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { id: 'e-1', date: todayStr, title: 'Bước chân Apple Health (8,432 bước)', durationMinutes: 75, caloriesBurned: 180, type: 'walk', isAutoSynced: true }
  ]);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [savedMeals, setSavedMeals] = useState<FoodItem[]>([INITIAL_FOOD_LOGS[0], INITIAL_FOOD_LOGS[1]]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 1. Initial Load from AsyncStorage
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [savedTheme, savedProfile, savedGoals, savedFoods, savedWeights, savedMeas, savedEx, savedFavs] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.FOOD_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.MEASUREMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.EXERCISES),
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS)
        ]);

        if (savedTheme) setThemeModeState(savedTheme as ThemeMode);
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
        if (savedGoals) setUserGoals(JSON.parse(savedGoals));
        if (savedFoods) setFoodLogs(JSON.parse(savedFoods));
        if (savedWeights) setWeightLogs(JSON.parse(savedWeights));
        if (savedMeas) setMeasurements(JSON.parse(savedMeas));
        if (savedEx) setExercises(JSON.parse(savedEx));
        if (savedFavs) setSavedMeals(JSON.parse(savedFavs));
      } catch (err) {
        console.error('Failed to load local data:', err);
      }
    };
    loadPersistedData();
  }, []);

  // 2. Auto-save effects
  const persist = (key: string, data: any) => {
    AsyncStorage.setItem(key, JSON.stringify(data)).catch((e) => console.warn('AsyncStorage save error', e));
  };

  const setThemeMode = (t: ThemeMode) => {
    triggerHaptic('light');
    setThemeModeState(t);
    AsyncStorage.setItem(STORAGE_KEYS.THEME, t);
  };

  const theme = themeMode === 'dark' ? DarkTheme : LightTheme;

  // 3. Toasts
  const showToast = (message: string, type: 'success' | 'error' | 'undo' | 'info' = 'success', undoAction?: () => void) => {
    const id = 'toast-' + Date.now();
    setToasts((prev) => [...prev, { id, message, type, undoAction }]);
    triggerHaptic(type === 'error' ? 'error' : 'light');
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 4. Food Log Actions
  const addFoodLog = (item: FoodItem) => {
    setFoodLogs((prev) => {
      const updated = [item, ...prev];
      persist(STORAGE_KEYS.FOOD_LOGS, updated);
      return updated;
    });

    // Cập nhật thống kê
    setUserProfile((prev) => {
      const updated = {
        ...prev,
        totalLoggedMeals: (prev.totalLoggedMeals || 0) + 1
      };
      persist(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });

    triggerHaptic('success');
    showToast(`Đã thêm "${item.name}"!`);
  };

  const updateFoodLog = (item: FoodItem) => {
    setFoodLogs((prev) => {
      const updated = prev.map((f) => (f.id === item.id ? item : f));
      persist(STORAGE_KEYS.FOOD_LOGS, updated);
      return updated;
    });
    triggerHaptic('success');
    showToast(`Đã cập nhật "${item.name}"`);
  };

  const deleteFoodLog = (id: string) => {
    const target = foodLogs.find((f) => f.id === id);
    if (!target) return;

    setFoodLogs((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      persist(STORAGE_KEYS.FOOD_LOGS, updated);
      return updated;
    });

    triggerHaptic('delete');
    showToast(`Đã xoá "${target.name}"`, 'undo', () => {
      setFoodLogs((prev) => {
        const restored = [target, ...prev];
        persist(STORAGE_KEYS.FOOD_LOGS, restored);
        return restored;
      });
      triggerHaptic('success');
    });
  };

  const toggleFavorite = (foodId: string) => {
    setFoodLogs((prev) => {
      const updated = prev.map((f) => (f.id === foodId ? { ...f, isFavorite: !f.isFavorite } : f));
      persist(STORAGE_KEYS.FOOD_LOGS, updated);
      return updated;
    });
  };

  const saveMeal = (food: FoodItem) => {
    setSavedMeals((prev) => {
      if (prev.some((s) => s.id === food.id || s.name === food.name)) {
        showToast(`"${food.name}" đã có trong danh sách lưu.`);
        return prev;
      }
      const updated = [food, ...prev];
      persist(STORAGE_KEYS.SAVED_MEALS, updated);
      showToast(`Đã lưu "${food.name}" vào thực đơn yêu thích!`);
      return updated;
    });
  };

  const removeSavedMeal = (id: string) => {
    setSavedMeals((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persist(STORAGE_KEYS.SAVED_MEALS, updated);
      return updated;
    });
    showToast('Đã xóa món khỏi danh sách lưu');
  };

  // 5. Weight & Measurements
  const addWeightLog = (weight: number, photoUrl?: string, note?: string) => {
    const newEntry: WeightEntry = {
      id: 'w-' + Date.now(),
      date: selectedDate,
      weight,
      photoUrl,
      note
    };

    setWeightLogs((prev) => {
      const updated = [newEntry, ...prev.filter((w) => w.date !== selectedDate)].sort((a, b) => b.date.localeCompare(a.date));
      persist(STORAGE_KEYS.WEIGHT_LOGS, updated);
      return updated;
    });

    setUserProfile((prev) => {
      const diff = +(prev.currentWeightKg - weight).toFixed(1);
      const totalLost = diff > 0 ? +(prev.totalWeightLostKg + diff).toFixed(1) : prev.totalWeightLostKg;
      const updated = {
        ...prev,
        currentWeightKg: weight,
        totalWeightLostKg: totalLost
      };
      persist(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });

    triggerHaptic('success');
    showToast(`Đã lưu cân nặng ${weight} kg`);
  };

  const addMeasurement = (measurement: Omit<BodyMeasurements, 'id' | 'date'>) => {
    const entry: BodyMeasurements = {
      id: 'm-' + Date.now(),
      date: selectedDate,
      ...measurement
    };
    setMeasurements((prev) => {
      const updated = [entry, ...prev];
      persist(STORAGE_KEYS.MEASUREMENTS, updated);
      return updated;
    });
    showToast('Đã lưu số đo cơ thể mới!');
  };

  // 6. Exercises
  const addExercise = (exercise: Omit<ExerciseEntry, 'id' | 'date'>) => {
    const entry: ExerciseEntry = {
      id: 'ex-' + Date.now(),
      date: selectedDate,
      ...exercise
    };
    setExercises((prev) => {
      const updated = [entry, ...prev];
      persist(STORAGE_KEYS.EXERCISES, updated);
      return updated;
    });
    showToast(`Đã ghi nhận bài tập: +${exercise.caloriesBurned} kcal`);
  };

  // 7. Mifflin-St Jeor BMR & Target Calculator
  const calculateAndApplyPlan = (survey: {
    gender: 'female' | 'male' | 'other';
    age: number;
    heightCm: number;
    currentWeightKg: number;
    targetWeightKg: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
    goal: 'lose' | 'maintain' | 'gain';
    weeklyPace: number;
    dietType: 'standard' | 'vegetarian' | 'vegan' | 'keto';
  }): UserGoals => {
    // 1. BMR Mifflin-St Jeor
    let bmr = 10 * survey.currentWeightKg + 6.25 * survey.heightCm - 5 * survey.age;
    bmr += survey.gender === 'male' ? 5 : -161;

    // 2. Activity Multiplier -> TDEE
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725
    };
    const tdee = Math.round(bmr * multipliers[survey.activityLevel]);

    // 3. Goal Deficit / Surplus
    const deficitPerDay = Math.round((survey.weeklyPace * 7700) / 7);
    let targetCalories = tdee;
    if (survey.goal === 'lose') {
      targetCalories = Math.max(1200, tdee - deficitPerDay);
    } else if (survey.goal === 'gain') {
      targetCalories = tdee + 400;
    }

    // 4. Macro Splits
    let proteinPct = 0.3;
    let carbsPct = 0.45;
    let fatPct = 0.25;

    if (survey.dietType === 'keto') {
      proteinPct = 0.25;
      carbsPct = 0.05;
      fatPct = 0.7;
    } else if (survey.dietType === 'vegan') {
      proteinPct = 0.25;
      carbsPct = 0.55;
      fatPct = 0.2;
    }

    const targetProtein = Math.round((targetCalories * proteinPct) / 4);
    const targetCarbs = Math.round((targetCalories * carbsPct) / 4);
    const targetFat = Math.round((targetCalories * fatPct) / 9);

    // Target Date
    const kgDiff = Math.abs(survey.currentWeightKg - survey.targetWeightKg);
    const weeksNeeded = Math.ceil(kgDiff / Math.max(0.2, survey.weeklyPace));
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const newGoals: UserGoals = {
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      currentWeight: survey.currentWeightKg,
      targetWeight: survey.targetWeightKg,
      targetDate: targetDateStr,
      weeklyPace: survey.weeklyPace,
      autoRecalculate: true
    };

    setUserGoals(newGoals);
    persist(STORAGE_KEYS.GOALS, newGoals);

    setUserProfile((prev) => {
      const updatedProfile: UserProfile = {
        ...prev,
        gender: survey.gender,
        age: survey.age,
        heightCm: survey.heightCm,
        currentWeightKg: survey.currentWeightKg,
        targetWeightKg: survey.targetWeightKg,
        activityLevel: survey.activityLevel,
        goal: survey.goal,
        dietType: survey.dietType
      };
      persist(STORAGE_KEYS.PROFILE, updatedProfile);
      return updatedProfile;
    });

    return newGoals;
  };

  // 8. CSV Data Exporter
  const exportDataAsCsv = (): string => {
    let csv = 'Ngày,Giờ,Bữa ăn,Tên món,Khối lượng (g),Calo (kcal),Protein (g),Carbs (g),Fat (g),Nguồn dữ liệu\n';
    foodLogs.forEach((f) => {
      csv += `${f.date},${f.time},${f.mealType},"${f.name}",${f.portionGrams || 100},${f.calories},${f.macros.protein},${f.macros.carbs},${f.macros.fat},"${f.fkbSourceLabel || f.source}"\n`;
    });
    return csv;
  };

  // 9. Reset All Data
  const resetAllData = async () => {
    await AsyncStorage.clear();
    setFoodLogs(INITIAL_FOOD_LOGS);
    setWeightLogs(INITIAL_WEIGHT_LOGS);
    setUserProfile(DEFAULT_PROFILE);
    setUserGoals(DEFAULT_GOALS);
    setSavedMeals([INITIAL_FOOD_LOGS[0], INITIAL_FOOD_LOGS[1]]);
    showToast('Đã đặt lại toàn bộ dữ liệu về mặc định.');
  };

  return (
    <AppContext.Provider
      value={{
        themeMode,
        setThemeMode,
        theme,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        userProfile,
        setUserProfile,
        userGoals,
        setUserGoals,
        foodLogs,
        setFoodLogs,
        weightLogs,
        measurements,
        exercises,
        achievements,
        savedMeals,
        toasts,
        showToast,
        removeToast,
        addFoodLog,
        updateFoodLog,
        deleteFoodLog,
        toggleFavorite,
        saveMeal,
        removeSavedMeal,
        addWeightLog,
        addMeasurement,
        addExercise,
        calculateAndApplyPlan,
        exportDataAsCsv,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
