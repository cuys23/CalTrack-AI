export const en = {
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    close: 'Close',
    add: 'Add',
    back: 'Back',
    kcal: 'kcal',
    done: 'Done',
    retry: 'Please try again.',
    loading: 'Loading...',
  },

  // Splash & Welcome
  splash: {
    tagline: 'Smart calorie & nutrition tracking',
  },
  welcome: {
    headline: 'Count calories with\njust a photo',
    subtext: 'Take a photo of your meal. AI automatically identifies ingredients, calculates calories, and tracks your goals.',
    start: 'Get Started',
    hasAccount: 'I already have an account',
  },

  // Home Screen
  home: {
    target: 'Target',
    consumed: 'Consumed',
    burned: 'Burned',
    activitiesToday: '{{count}} activities today',
    noActivities: 'No activities today',
    burnedKcal: '+{{count}} kcal burned',
    tapToAdd: 'Tap to add activity',
    foodJournal: 'Food Journal',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks & Drinks',
    noMeal: 'No {{meal}} logged',
    scanNow: '+ Scan now',
  },

  // Camera
  camera: {
    permissionDenied: 'Camera permission is disabled for CalorieIQ',
    permissionRequest: 'Allow CalorieIQ to access Camera to scan food',
    openSettings: 'Open Settings',
    grantPermission: 'Grant Camera Access',
    settingsGuide: 'Open Settings → CalorieIQ → Camera to enable.',
    placeFood: 'Place food in the frame',
    placeBarcode: 'Place barcode in the center',
    captureLabel: 'Capture the nutrition label clearly',
    food: 'Food',
    barcode: 'Barcode',
    label: 'Label',
    captureError: 'Could not take photo. Please try again.',
    galleryError: 'Could not read selected image.',
    cameraNotReady: 'Camera not ready. Please try again.',
  },

  // Paywall
  paywall: {
    restore: 'Restore',
    unlockPro: 'Unlock CalorieIQ Pro',
    proSubtitle: 'Unlimited scans with 99.8% food recognition accuracy',
    features: [
      'Unlimited food scanning with Camera AI',
      'Full micronutrient analysis (Fiber, Sodium, Sugar)',
      'Drink analysis & instant barcode scanning',
      'Two-way Apple Health / Cloud Sync',
      'Personalized medical-grade macro plans',
    ],
    save50: 'SAVE 50%',
    yearlyPlan: 'Yearly Plan (Recommended)',
    yearlyPrice: '$29.99 / year (only $2.49 / month)',
    monthlyPlan: 'Monthly Plan',
    monthlyPrice: '$4.99 / month',
    activating: 'Activating...',
    startTrial: 'Start 7-day free trial',
    legalNote: 'Subscriptions auto-renew at the selected billing cycle unless cancelled at least 24 hours before the cycle ends. Payment is charged to your Apple ID upon purchase confirmation. You can cancel anytime in Settings → Apple ID → Subscriptions. Lifetime is a one-time purchase, no renewal.',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    noReceipt: 'Transaction has no verification code. Please try again.',
    verifyFailed: 'Could not verify transaction. Please try again.',
    unlockSuccess: 'Congratulations! You have unlocked CalorieIQ Pro!',
    transactionFailed: 'Transaction could not be completed.',
    notConnected: 'Cannot connect to App Store. Please try again shortly.',
    noRestore: 'No previous transactions found to restore.',
    restoreSuccess: 'Purchases restored successfully!',
    noActiveRestore: 'No active transactions found.',
    restoreFailed: 'Could not restore transactions.',
  },

  // Sign In
  signin: {
    title: 'Sign in to CalorieIQ',
    subtitle: 'Securely sync your calorie data and progress to the cloud.',
    authenticating: 'Authenticating...',
    continueApple: '\u{F8FF}  Continue with Apple',
    continueGoogle: '🌐  Continue with Google',
    continueGuest: 'Continue as Guest',
    loginSuccess: '{{provider}} sign-in successful!',
    loginFailed: 'Could not sign in with {{provider}}.',
  },

  // Auth Modal
  auth: {
    badge: 'CalorieIQ Account',
    title: 'Sign in to CalorieIQ',
    subtitle: 'Sign in to save your nutrition goals and manage your CalorieIQ Pro subscription.',
    legalNote: 'By continuing, you agree to the Terms of Use and Privacy Policy of CalorieIQ.',
  },

  // Food Result
  food: {
    aiResult: 'AI Result',
    healthScore: 'Health Score',
    portion: 'Portion',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    confidence: 'Confidence',
    source: 'Source',
    addToLog: 'Add to food log',
    aiNotRight: 'AI not right?',
    saveToFavorites: 'Save to favorites',
    barcodeNotFound: 'Product not found for this barcode. You can enter manually.',
    proFeature: 'AI scanning is a CalorieIQ Pro feature.',
  },

  // Scanning Sheets
  scan: {
    fixTitle: 'Fix AI Result',
    fixSubtitle: 'Give feedback so AI recalculates nutrition more accurately.',
    fixSuggestions: ['Less oil', 'Larger portion', 'No rice', 'More vegetables'],
    fixPlaceholder: 'E.g. Only ate half the portion...',
    updateNutrition: 'Update nutrition',
    quickAddTitle: 'Quick Add Calories',
    quickAddSave: 'Add to log',
  },

  // Profile
  profile: {
    title: 'Profile & Settings',
    proUnlimited: 'CalorieIQ Pro Unlimited',
    upgradePro: 'Upgrade to Pro',
    stats: {
      daysUsing: 'Days',
      mealsLogged: 'Meals',
      weightLost: 'kg Lost',
    },
    sections: {
      goals: 'Daily Goals',
      notifications: 'Notifications',
      healthSync: 'Health Sync',
      achievements: 'Achievements',
      referral: 'Referral Program',
      widgets: 'Widgets',
      appearance: 'Appearance',
      language: 'Language',
      exportCsv: 'Export CSV',
      restorePurchases: 'Restore Purchases',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      deleteAccount: 'Delete Account',
      resetData: 'Reset All Data',
    },
    darkMode: 'Dark',
    lightMode: 'Light',
    exportSuccess: 'CalorieIQ food journal (CSV) exported successfully!',
    restoreNone: 'No transactions found to restore.',
    restoreSuccess: 'Purchases restored successfully!',
    logoutSuccess: 'Signed out successfully.',
    logoutFailed: 'Could not sign out.',
    deleteTitle: 'Delete Account',
    deleteMessage: 'Are you sure you want to delete all account data? This follows Apple App Store guidelines (5.1.1) and cannot be undone.',
    deleteConfirm: 'Delete Permanently',
    deleteSuccess: 'Account and data have been completely deleted.',
    deleteFailed: 'Error deleting account.',
    resetSuccess: 'All data has been reset to defaults.',
    version: 'CalorieIQ • v1.0.0 (Build 24)',
  },

  // Progress
  progress: {
    title: 'Progress & Reports',
    weight: 'Weight',
    bodyMeasurements: 'Body Measurements',
    photoCompare: 'Photo Comparison',
    weeklyReport: 'Weekly Report',
    addWeight: 'Add Weight',
    addMeasurement: 'Add Measurement',
    noData: 'No data yet',
  },

  // Exercise
  exercise: {
    title: 'Exercise & Activity',
    addExercise: 'Add Exercise',
    totalBurned: 'Total Burned',
    noExercise: 'No exercises logged today',
    healthSyncTitle: 'Health Sync Settings',
    healthSyncDesc: 'CalorieIQ reads your daily step count and calories burned to accurately calculate your net calorie intake.',
    settingsGuide: '→ Health → CalorieIQ.',
  },

  // Achievements & Gamification
  achievements: {
    title: 'Achievements',
    firstDay: 'First Day',
    firstDayDesc: 'Log your first meal',
    sevenDays: '7-day Streak',
    sevenDaysDesc: 'Achieve a 7-day streak',
    proteinMaster: 'Protein Master',
    proteinMasterDesc: 'Hit 130g protein in a day',
    thirtyDays: 'Conquer 30 Days',
    thirtyDaysDesc: 'Log consistently for a month',
  },

  // Streak
  streak: {
    title: 'Daily Streak',
    currentStreak: 'Current Streak',
    longestStreak: 'Longest Streak',
    freezesLeft: 'Freezes Remaining',
    days: 'days',
  },

  // Referral
  referral: {
    title: 'Referral Program',
    description: 'Every time a friend signs up with your code, you both get 1 month of CalorieIQ Pro for free.',
    yourCode: 'Your Code',
    friendsReferred: 'Friends Referred',
    shareCode: 'Share Code',
  },

  // Onboarding
  onboarding: {
    genderTitle: 'What is your gender?',
    female: 'Female',
    male: 'Male',
    other: 'Other',
    ageTitle: 'How old are you?',
    heightTitle: 'Your height (cm)',
    weightTitle: 'Current weight (kg)',
    targetWeightTitle: 'Target weight (kg)',
    activityTitle: 'Activity level',
    sedentary: 'Sedentary',
    light: 'Light',
    moderate: 'Moderate',
    veryActive: 'Very Active',
    goalTitle: 'Your goal',
    lose: 'Lose Weight',
    maintain: 'Maintain',
    gain: 'Gain Weight',
    next: 'Next',
    finish: 'Finish',
  },

  // Library
  library: {
    searchPlaceholder: 'Search pho, rice, noodles...',
    savedMeals: 'Saved Meals',
    createFood: 'Create Food',
    noSavedMeals: 'No saved meals yet',
  },

  // Nutrition Detail
  nutrition: {
    title: 'Nutrition Details',
    remaining: 'Remaining',
    exceeded: 'Exceeded',
    logMenu: 'Log Food',
    textLog: 'Text Log',
    textLogPlaceholder: 'Type your food here...',
  },

  // Toasts / Notifications
  toast: {
    addedFood: 'Added "{{name}}"!',
    updatedFood: 'Updated "{{name}}"',
    deletedFood: 'Deleted "{{name}}"',
    savedMeal: '"{{name}}" saved to favorites!',
    removedMeal: 'Removed from favorites.',
    savedWeight: 'Saved weight {{weight}} kg',
    savedMeasurement: 'New body measurement saved!',
    savedExercise: 'Logged exercise: +{{calories}} kcal',
    toggleFavorite: 'Toggled favorite',
  },

  // Settings
  settings: {
    editGoals: 'Edit Goals',
    notifications: 'Notification Settings',
    widgets: 'Widgets & Watch',
  },
};

export type TranslationKeys = typeof en;
