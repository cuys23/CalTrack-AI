export type ThemeMode = 'light' | 'dark' | 'system';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type NutrientSource = 'verified' | 'estimated' | 'user_edited';

export interface MacroNutrients {
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
}

export interface MicroNutrients {
  fiber?: number;       // g
  sugar?: number;       // g
  sodium?: number;      // mg
  cholesterol?: number; // mg
  potassium?: number;   // mg
  calcium?: number;     // mg
  iron?: number;        // mg
  vitaminC?: number;    // mg
  vitaminD?: number;    // mcg
}

export interface IngredientItem {
  id: string;
  name: string;
  amount: string;
  grams?: number;
  calories: number;
  macros: MacroNutrients;
  fkbId?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  mealType: MealType;
  time: string; // "08:15"
  date: string; // "YYYY-MM-DD"
  calories: number;
  portion: number;
  portionUnit: string; // "bát", "đĩa", "phần", "gram", "cái", "ly"
  portionGrams?: number;
  macros: MacroNutrients;
  micros?: MicroNutrients;
  healthScore: number; // 1-10
  confidence: 'high' | 'medium' | 'low';
  source?: NutrientSource;
  fkbSourceLabel?: string; // "Viện Dinh Dưỡng VN (VN FCT)" | "USDA FoodData Central" | "AI Vision"
  imageUrl?: string;
  ingredients?: IngredientItem[];
  barcode?: string;
  isFavorite?: boolean;
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  weight: number; // in kg
  photoUrl?: string;
  note?: string;
}

export interface BodyMeasurements {
  id: string;
  date: string;
  waist: number;     // cm
  hips: number;      // cm
  chest: number;     // cm
  arms: number;      // cm
  bodyFatPercentage: number; // %
}

export interface ExerciseEntry {
  id: string;
  date: string;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  type: 'cardio' | 'strength' | 'walk' | 'other';
  isAutoSynced?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number; // 0 to 100
  target: string;
}

export interface UserGoals {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  currentWeight: number;
  targetWeight: number;
  targetDate: string;
  weeklyPace: number; // kg/week
  autoRecalculate: boolean;
  bmr?: number;
  tdee?: number;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  gender: 'female' | 'male' | 'other';
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'active';
  goal: 'lose' | 'maintain' | 'gain';
  dietType: 'standard' | 'vegetarian' | 'vegan' | 'keto';
  isPro: boolean;
  proExpiresAt?: string;
  scanQuotaRemaining: number;
  referralCode: string;
  referredCount: number;
  streakCount: number;
  longestStreak: number;
  streakFreezesRemaining: number;
  appDaysCount: number;
  totalLoggedMeals: number;
  totalWeightLostKg: number;
  eatingHabits?: string[];
  timeCommitment?: string;
  interestedFeatures?: string[];
  bmr?: number;
  tdee?: number;
}
