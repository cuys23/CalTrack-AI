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
import { apiClient } from '../services/apiClient';
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

  /**
   * Whether the account currently holds a Pro entitlement. The server is the
   * authority; this mirrors it so screens can gate without a round trip.
   *
   * Never persisted. Reading it from local storage would let anyone with device
   * access grant themselves Pro by editing a file.
   */
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;

  exportDataAsCsv: () => string;
  resetAllData: () => Promise<void>;
  wipeLocalAccountData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** Computed fresh on every call so date rolls over at midnight. */
const getToday = () => new Date().toISOString().split('T')[0];

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
  name: '',
  avatarUrl: '',
  gender: 'female',
  age: 25,
  heightCm: 165,
  currentWeightKg: 60,
  targetWeightKg: 55,
  activityLevel: 'moderate',
  goal: 'lose',
  dietType: 'standard',
  isPro: false,
  scanQuotaRemaining: 10,
  referralCode: '',
  referredCount: 0,
  streakCount: 0,
  longestStreak: 0,
  streakFreezesRemaining: 0,
  appDaysCount: 0,
  totalLoggedMeals: 0,
  totalWeightLostKg: 0
};

const DEFAULT_GOALS: UserGoals = {
  targetCalories: 2000,
  targetProtein: 120,
  targetCarbs: 200,
  targetFat: 60,
  currentWeight: 60,
  targetWeight: 55,
  targetDate: '',
  weeklyPace: 0.5,
  autoRecalculate: true
};

const INITIAL_FOOD_LOGS: FoodItem[] = [];

const INITIAL_WEIGHT_LOGS: WeightEntry[] = [];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'Ngày đầu tiên', description: 'Ghi món ăn đầu tiên', icon: '🌟', progress: 0, target: '1 món' },
  { id: 'ach-2', title: '7 ngày kiên trì', description: 'Đạt chuỗi 7 ngày liên tiếp', icon: '🔥', progress: 0, target: '7 ngày' },
  { id: 'ach-3', title: 'Bậc thầy Protein', description: 'Đạt 130g protein trong 1 ngày', icon: '🥩', progress: 0, target: '1 ngày' },
  { id: 'ach-4', title: 'Chinh phục 30 ngày', description: 'Ghi nhật ký liên tục 1 tháng', icon: '🏆', progress: 0, target: '30 ngày' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [selectedDate, setSelectedDate] = useState<string>(getToday());

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [userGoals, setUserGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [foodLogs, setFoodLogs] = useState<FoodItem[]>(INITIAL_FOOD_LOGS);
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>(INITIAL_WEIGHT_LOGS);
  const [measurements, setMeasurements] = useState<BodyMeasurements[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [savedMeals, setSavedMeals] = useState<FoodItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Deliberately not restored from storage: entitlement comes from the server,
  // so a fresh launch starts locked and unlocks once the server confirms.
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // 1. Initial Load from AsyncStorage
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [savedTheme, savedProfile, savedGoals, savedFoods, savedWeights, savedMeas, savedEx, savedFavs, savedAchievements] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.FOOD_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.MEASUREMENTS),
          AsyncStorage.getItem(STORAGE_KEYS.EXERCISES),
          AsyncStorage.getItem(STORAGE_KEYS.SAVED_MEALS),
          AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
        ]);

        if (savedTheme) setThemeModeState(savedTheme as ThemeMode);
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
        if (savedGoals) setUserGoals(JSON.parse(savedGoals));
        if (savedFoods) setFoodLogs(JSON.parse(savedFoods));
        if (savedWeights) setWeightLogs(JSON.parse(savedWeights));
        if (savedMeas) setMeasurements(JSON.parse(savedMeas));
        if (savedEx) setExercises(JSON.parse(savedEx));
        if (savedFavs) setSavedMeals(JSON.parse(savedFavs));
        if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
      } catch (err) {
        console.error('Failed to load local data:', err);
      }
    };
    loadPersistedData();
  }, []);

  // 1b. Ask the server whether this account is entitled.
  //
  // Entitlement starts false and is never restored from local storage, so
  // without this a paying subscriber would relaunch the app and find Pro locked.
  // A failure leaves it locked rather than guessing generously.
  useEffect(() => {
    const syncEntitlement = async () => {
      try {
        if (!(await apiClient.getToken())) return;

        const res = await apiClient.getIapStatus();
        setIsPremium(Boolean(res.is_premium));
      } catch {
        // Offline or an expired session: stay locked until the server answers.
      }
    };
    syncEntitlement();
  }, []);

  // 2. Auto-save effects
  const persist = (key: string, data: any) => {
    AsyncStorage.setItem(key, JSON.stringify(data)).catch((e) => console.warn('AsyncStorage save error', e));
  };

  // Achievements had a storage key but nothing ever wrote to it, so badge
  // progress silently reset every time the app was reopened.
  useEffect(() => {
    persist(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }, [achievements]);

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
    setFoodLogs([]);
    setWeightLogs([]);
    setMeasurements([]);
    setExercises([]);
    setSavedMeals([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setUserProfile(DEFAULT_PROFILE);
    setUserGoals(DEFAULT_GOALS);
    setIsPremium(false);
    showToast('Đã đặt lại toàn bộ dữ liệu về mặc định.');
  };

  /**
   * Wipe every trace of the account from this device.
   *
   * Deleting server-side is only half of Guideline 5.1.1(v): leaving the auth
   * token and the meal history on the phone means the account looks deleted
   * while its data is still sitting there.
   */
  const wipeLocalAccountData = async () => {
    await apiClient.setToken(null);
    await AsyncStorage.clear();

    setFoodLogs([]);
    setWeightLogs([]);
    setMeasurements([]);
    setExercises([]);
    setSavedMeals([]);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setUserProfile(DEFAULT_PROFILE);
    setUserGoals(DEFAULT_GOALS);
    setIsPremium(false);
  };

  return (
    <AppContext.Provider
      value={{
        themeMode,
        setThemeMode,
        theme,
        selectedDate,
        setSelectedDate,
        isPremium,
        setIsPremium,
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
        resetAllData,
        wipeLocalAccountData
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
