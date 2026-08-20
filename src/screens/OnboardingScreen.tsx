import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  ChevronLeft,
  Check,
  AlertCircle,
  Clock,
  Lightbulb,
  ArrowDown,
  ArrowUp,
  Minus,
  AlertTriangle,
  Camera,
  Barcode,
  Type,
  Heart,
  TrendingUp,
  Flame,
  Calendar,
  Sparkles
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { RulerPicker } from '../components/RulerPicker';
import { CalorieRing, MacroRing } from '../components/CalorieRing';
import { triggerHaptic } from '../utils/haptics';
import { UserGoals } from '../types';

interface OnboardingScreenProps {
  onFinish: () => void;
}

type OnboardingStep =
  | 'problem'
  | 'gender'
  | 'age'
  | 'body'
  | 'activity'
  | 'goal'
  | 'pace'
  | 'lifestyle'
  | 'feature'
  | 'calculating'
  | 'plan'
  | 'preview';

const STEPS_ORDER: OnboardingStep[] = [
  'problem',
  'gender',
  'age',
  'body',
  'activity',
  'goal',
  'pace',
  'lifestyle',
  'feature',
  'calculating',
  'plan',
  'preview'
];

const GROUP_CONFIG: Record<string, { groupIndex: number; stepInGroup: number; groupTotal: number; groupName: string }> = {
  gender: { groupIndex: 0, stepInGroup: 1, groupTotal: 3, groupName: 'VỀ BẠN' },
  age: { groupIndex: 0, stepInGroup: 2, groupTotal: 3, groupName: 'VỀ BẠN' },
  body: { groupIndex: 0, stepInGroup: 3, groupTotal: 3, groupName: 'VỀ BẠN' },
  activity: { groupIndex: 1, stepInGroup: 1, groupTotal: 3, groupName: 'MỤC TIÊU' },
  goal: { groupIndex: 1, stepInGroup: 2, groupTotal: 3, groupName: 'MỤC TIÊU' },
  pace: { groupIndex: 1, stepInGroup: 3, groupTotal: 3, groupName: 'MỤC TIÊU' },
  lifestyle: { groupIndex: 2, stepInGroup: 1, groupTotal: 2, groupName: 'THÓI QUEN' },
  feature: { groupIndex: 2, stepInGroup: 2, groupTotal: 2, groupName: 'THÓI QUEN' },
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { theme, themeMode, calculateAndApplyPlan } = useApp();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('problem');

  // Form states
  const [gender, setGender] = useState<'female' | 'male' | 'other'>('female');
  const [age, setAge] = useState(25);
  const [heightCm, setHeightCm] = useState(165);
  const [weightKg, setWeightKg] = useState(65.0);
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('lose');
  const [targetWeightKg, setTargetWeightKg] = useState(58.0);
  const [weeklyPace, setWeeklyPace] = useState(0.5);
  const [eatingHabits, setEatingHabits] = useState<string[]>(['eat_out', 'vietnamese']);
  const [timeCommitment, setTimeCommitment] = useState<'under_1min' | '2_3min' | '5min_plus'>('2_3min');
  const [interestedFeatures, setInterestedFeatures] = useState<string[]>(['ai_scan', 'progress']);

  // Calculated Results
  const [calculatedGoals, setCalculatedGoals] = useState<UserGoals | null>(null);
  const [bmr, setBmr] = useState(1450);
  const [tdee, setTdee] = useState(2100);
  const [etaDateStr, setEtaDateStr] = useState('');

  // Calculating & Plan screen animations
  const [calcTick1, setCalcTick1] = useState(false);
  const [calcTick2, setCalcTick2] = useState(false);
  const [calcTick3, setCalcTick3] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [planAnimVal, setPlanAnimVal] = useState(1);
  const transitionAnim = useRef(new Animated.Value(1)).current;
  const [transitionDir, setTransitionDir] = useState<'fwd' | 'back'>('fwd');

  // Auto-advance timer ref
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoTimer = () => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearAutoTimer();
  }, []);

  // Step transition slide & fade animation
  useEffect(() => {
    transitionAnim.setValue(0);
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [currentStep]);

  // Plan count-up animation over 1.1s
  useEffect(() => {
    if (currentStep === 'plan') {
      setPlanAnimVal(0);
      const start = Date.now();
      let animId: number;
      const tick = () => {
        const elapsed = Date.now() - start;
        const p = Math.min(1, elapsed / 1100);
        const ease = 1 - Math.pow(1 - p, 3);
        setPlanAnimVal(ease);
        if (p < 1) {
          animId = requestAnimationFrame(tick);
        }
      };
      animId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animId);
    }
  }, [currentStep]);

  // Update default weights on gender switch if untouched
  const handleSelectGender = (g: 'female' | 'male' | 'other') => {
    setGender(g);
    triggerHaptic('light');
    if (g === 'female') {
      setHeightCm(162);
      setWeightKg(56.0);
      setTargetWeightKg(50.0);
    } else {
      setHeightCm(172);
      setWeightKg(72.0);
      setTargetWeightKg(66.0);
    }
    clearAutoTimer();
    autoTimerRef.current = setTimeout(() => {
      goToNextStep();
    }, 280);
  };

  const handleSelectActivity = (act: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') => {
    setActivityLevel(act);
    triggerHaptic('light');
    clearAutoTimer();
    autoTimerRef.current = setTimeout(() => {
      goToNextStep();
    }, 280);
  };

  const toggleHabit = (h: string) => {
    triggerHaptic('tick');
    setEatingHabits((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  };

  const toggleFeature = (f: string) => {
    triggerHaptic('tick');
    setInterestedFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  // Run calculation logic
  const runCalculation = () => {
    const act = activityLevel === 'active' ? 'very_active' : activityLevel;
    const plan = calculateAndApplyPlan({
      gender,
      age,
      heightCm,
      currentWeightKg: weightKg,
      targetWeightKg: goal === 'maintain' ? weightKg : targetWeightKg,
      activityLevel: act,
      goal,
      weeklyPace: goal === 'maintain' ? 0 : weeklyPace,
      dietType: 'standard'
    });

    // Calculate BMR & TDEE
    let calculatedBmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    calculatedBmr += gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
    const mults = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const calculatedTdee = Math.round(calculatedBmr * (mults[activityLevel] || 1.55));

    setBmr(Math.round(calculatedBmr));
    setTdee(calculatedTdee);
    setCalculatedGoals(plan);

    // Calculate ETA Date string (DD/MM/YYYY)
    if (goal !== 'maintain' && weeklyPace > 0) {
      const diff = Math.abs(weightKg - targetWeightKg);
      const weeks = diff / weeklyPace;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.round(weeks * 7));
      const p2 = (n: number) => (n < 10 ? '0' + n : String(n));
      setEtaDateStr(`${p2(targetDate.getDate())}/${p2(targetDate.getMonth() + 1)}/${targetDate.getFullYear()}`);
    }
  };

  // Handle Calculating Animation Screen
  useEffect(() => {
    if (currentStep === 'calculating') {
      setCalcTick1(false);
      setCalcTick2(false);
      setCalcTick3(false);

      // Start spinning loop
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();

      runCalculation();

      const t1 = setTimeout(() => {
        triggerHaptic('tick');
        setCalcTick1(true);
      }, 700);

      const t2 = setTimeout(() => {
        triggerHaptic('tick');
        setCalcTick2(true);
      }, 1400);

      const t3 = setTimeout(() => {
        triggerHaptic('tick');
        setCalcTick3(true);
      }, 2100);

      const t4 = setTimeout(() => {
        triggerHaptic('success');
        setCurrentStep('plan');
      }, 2700);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [currentStep]);

  const goToNextStep = () => {
    clearAutoTimer();
    triggerHaptic('light');
    setTransitionDir('fwd');

    const currentIndex = STEPS_ORDER.indexOf(currentStep);

    if (currentStep === 'goal' && goal === 'maintain') {
      // Skip pace if maintaining weight
      setCurrentStep('lifestyle');
      return;
    }

    if (currentStep === 'feature') {
      // Transition to calculating
      setCurrentStep('calculating');
      return;
    }

    if (currentIndex < STEPS_ORDER.length - 1) {
      setCurrentStep(STEPS_ORDER[currentIndex + 1]);
    } else {
      triggerHaptic('success');
      onFinish();
    }
  };

  const goToPreviousStep = () => {
    clearAutoTimer();
    triggerHaptic('light');
    setTransitionDir('back');
    const currentIndex = STEPS_ORDER.indexOf(currentStep);

    if (currentStep === 'lifestyle' && goal === 'maintain') {
      setCurrentStep('goal');
      return;
    }

    if (currentIndex > 0) {
      setCurrentStep(STEPS_ORDER[currentIndex - 1]);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const groupInfo = GROUP_CONFIG[currentStep];
  const showTopBar = currentStep !== 'problem' && currentStep !== 'calculating';
  const showBack = showTopBar;
  const showSkip = currentStep === 'lifestyle' || currentStep === 'feature';

  // Target warning check
  let targetWarningText = '';
  if (currentStep === 'goal' && goal !== 'maintain') {
    const diff = targetWeightKg - weightKg;
    if (goal === 'lose' && diff >= 0) {
      targetWarningText = `Mục tiêu giảm cân cần thấp hơn cân nặng hiện tại (${weightKg} kg).`;
    } else if (goal === 'gain' && diff <= 0) {
      targetWarningText = `Mục tiêu tăng cân cần cao hơn cân nặng hiện tại (${weightKg} kg).`;
    } else if (Math.abs(diff) > weightKg * 0.3) {
      targetWarningText = 'Mục tiêu chênh lệch hơn 30% cân nặng hiện tại. Hãy chia nhỏ theo từng giai đoạn.';
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Top Navigation Bar with 3-Segment Progress */}
      {showTopBar && (
        <View style={styles.navBar}>
          <View style={styles.navRow}>
            {showBack ? (
              <TouchableOpacity
                onPress={goToPreviousStep}
                style={[styles.backBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              >
                <ChevronLeft size={18} color={theme.text} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}

            <View style={{ flex: 1 }} />

            {showSkip && (
              <TouchableOpacity onPress={goToNextStep} style={styles.skipBtn}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>Bỏ qua</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3-Segment Progress Bar */}
          {groupInfo && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.segmentsRow}>
                {[0, 1, 2].map((gIdx) => {
                  let fillPercent = 0;
                  if (groupInfo.groupIndex > gIdx) fillPercent = 100;
                  else if (groupInfo.groupIndex === gIdx) {
                    fillPercent = (groupInfo.stepInGroup / groupInfo.groupTotal) * 100;
                  }
                  return (
                    <View key={gIdx} style={[styles.segTrack, { backgroundColor: theme.surfaceAlt }]}>
                      <View style={[styles.segFill, { width: `${fillPercent}%`, backgroundColor: '#FF6B35' }]} />
                    </View>
                  );
                })}
              </View>
              <Text style={[styles.groupLabel, { color: theme.textTertiary }]}>
                {groupInfo.groupName} · BƯỚC {groupInfo.stepInGroup}/{groupInfo.groupTotal}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 2. Step Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: transitionAnim,
            transform: [
              {
                translateX: transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [transitionDir === 'fwd' ? 44 : -44, 0]
                })
              }
            ]
          }}
        >
        {/* ================= STEP: PROBLEM & PROMISE ================= */}
        {currentStep === 'problem' && (
          <View style={{ gap: 18, paddingTop: 20 }}>
            <Text style={[styles.largeTitle, { color: theme.text }]}>Bạn có đang gặp những vấn đề này?</Text>

            <View style={{ gap: 12 }}>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.iconSquare, { backgroundColor: 'rgba(229, 72, 77, 0.14)' }]}>
                  <AlertCircle size={20} color="#E5484D" />
                </View>
                <Text style={[styles.cardText, { color: theme.text }]}>
                  Đoán calo sai → tăng cân mà không hiểu tại sao
                </Text>
              </View>

              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.iconSquare, { backgroundColor: 'rgba(245, 165, 36, 0.14)' }]}>
                  <Clock size={20} color="#F5A524" />
                </View>
                <Text style={[styles.cardText, { color: theme.text }]}>
                  Bỏ cuộc sau 1–2 tuần vì quá phức tạp
                </Text>
              </View>

              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.iconSquare, { backgroundColor: 'rgba(62, 123, 250, 0.14)' }]}>
                  <Lightbulb size={20} color="#3E7BFA" />
                </View>
                <Text style={[styles.cardText, { color: theme.text }]}>
                  Không biết ăn gì để vừa ngon vừa đúng mục tiêu
                </Text>
              </View>
            </View>

            {/* Promise Box */}
            <View style={[styles.promiseBox, { backgroundColor: 'rgba(255, 107, 53, 0.10)', borderColor: 'rgba(255, 107, 53, 0.28)' }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#FF6B35' }}>LỜI HỨA</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, lineHeight: 22 }}>
                CalorieIQ giúp bạn giải quyết tất cả chỉ với 1 tấm ảnh
              </Text>
            </View>
          </View>
        )}

        {/* ================= STEP: GENDER ================= */}
        {currentStep === 'gender' && (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Giới tính của bạn?</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Dùng để tính chỉ số trao đổi chất cơ bản (BMR).
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {[
                { id: 'female', label: 'Nữ', symbol: '♀' },
                { id: 'male', label: 'Nam', symbol: '♂' },
                { id: 'other', label: 'Khác', symbol: '⚥' }
              ].map((item) => {
                const isSelected = gender === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelectGender(item.id as any)}
                    style={[
                      styles.selectionCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isSelected ? '#FF6B35' : theme.border,
                        borderWidth: isSelected ? 2 : 1
                      }
                    ]}
                  >
                    <View style={[styles.symbolBox, { backgroundColor: theme.surfaceAlt }]}>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>{item.symbol}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: theme.text }}>{item.label}</Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= STEP: AGE ================= */}
        {currentStep === 'age' && (
          <View style={{ gap: 16, alignItems: 'center' }}>
            <View style={{ gap: 6, width: '100%' }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Bạn bao nhiêu tuổi?</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Tuổi ảnh hưởng trực tiếp tới nhu cầu năng lượng hàng ngày.
              </Text>
            </View>
            <RulerPicker min={14} max={80} step={1} value={age} onChange={setAge} unit="tuổi" majorEvery={5} />
          </View>
        )}

        {/* ================= STEP: BODY (HEIGHT + WEIGHT DUAL) ================= */}
        {currentStep === 'body' && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Số đo hiện tại</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Chiều cao và cân nặng, gộp chung trong một bước tiện lợi.
              </Text>
            </View>

            <RulerPicker
              min={140}
              max={220}
              step={1}
              value={heightCm}
              onChange={setHeightCm}
              unit="cm"
              label="CHIỀU CAO"
              majorEvery={5}
            />

            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />

            <RulerPicker
              min={30}
              max={200}
              step={0.5}
              value={weightKg}
              onChange={setWeightKg}
              unit="kg"
              label="CÂN NẶNG"
              majorEvery={10}
            />
          </View>
        )}

        {/* ================= STEP: ACTIVITY ================= */}
        {currentStep === 'activity' && (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Mức độ vận động hàng ngày?</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Dùng để tính tổng mức tiêu hao năng lượng (TDEE) chính xác hơn.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { id: 'sedentary', title: 'Ít vận động', desc: 'Ngồi nhiều, ít đi lại', dots: 1 },
                { id: 'light', title: 'Vận động nhẹ', desc: 'Đi bộ, làm việc nhà', dots: 2 },
                { id: 'moderate', title: 'Vận động vừa', desc: 'Tập 3–4 buổi/tuần', dots: 3 },
                { id: 'active', title: 'Vận động nhiều', desc: 'Tập 5–6 buổi/tuần', dots: 4 },
                { id: 'very_active', title: 'Rất năng động', desc: 'Tập nặng + lao động thể chất', dots: 5 }
              ].map((act) => {
                const isSelected = activityLevel === act.id;
                return (
                  <TouchableOpacity
                    key={act.id}
                    onPress={() => handleSelectActivity(act.id as any)}
                    style={[
                      styles.activityCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isSelected ? '#FF6B35' : theme.border,
                        borderWidth: isSelected ? 2 : 1
                      }
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{act.title}</Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{act.desc}</Text>
                    </View>

                    {/* Dots indicator */}
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <View
                          key={dot}
                          style={[
                            styles.dotMeter,
                            { backgroundColor: dot <= act.dots ? '#FF6B35' : theme.border }
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= STEP: GOAL & TARGET WEIGHT ================= */}
        {currentStep === 'goal' && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Mục tiêu của bạn?</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Chọn định hướng dinh dưỡng để xây dựng kế hoạch.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { id: 'lose', label: 'Giảm cân', icon: ArrowDown, color: '#22C55E' },
                { id: 'maintain', label: 'Duy trì', icon: Minus, color: '#3E7BFA' },
                { id: 'gain', label: 'Tăng cân / Tăng cơ', icon: ArrowUp, color: '#FF6B35' }
              ].map((item) => {
                const isSelected = goal === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      triggerHaptic('light');
                      setGoal(item.id as any);
                    }}
                    style={[
                      styles.selectionCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isSelected ? '#FF6B35' : theme.border,
                        borderWidth: isSelected ? 2 : 1
                      }
                    ]}
                  >
                    <View style={[styles.symbolBox, { backgroundColor: `${item.color}20` }]}>
                      <item.icon size={20} color={item.color} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: theme.text }}>{item.label}</Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Target Weight Ruler (only if lose or gain) */}
            {goal !== 'maintain' && (
              <View style={{ marginTop: 10 }}>
                <RulerPicker
                  min={30}
                  max={200}
                  step={0.5}
                  value={targetWeightKg}
                  onChange={setTargetWeightKg}
                  unit="kg"
                  label="CÂN NẶNG MỤC TIÊU"
                  majorEvery={10}
                />
              </View>
            )}

            {targetWarningText ? (
              <View style={[styles.warningBox, { backgroundColor: 'rgba(245, 165, 36, 0.12)', borderColor: 'rgba(245, 165, 36, 0.35)' }]}>
                <AlertTriangle size={16} color="#F5A524" />
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#F5A524', lineHeight: 17 }}>
                  {targetWarningText}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ================= STEP: PACE ================= */}
        {currentStep === 'pace' && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Tốc độ bạn muốn?</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Tốc độ càng nhanh, mức thâm hụt calo mỗi ngày càng lớn.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { val: 0.25, title: 'Chậm & bền vững', rate: '0.25 kg/tuần' },
                { val: 0.5, title: 'Vừa phải', rate: '0.5 kg/tuần', recommended: true },
                { val: 0.75, title: 'Nhanh', rate: '0.75 kg/tuần' },
                { val: 1.0, title: 'Rất nhanh', rate: '1.0 kg/tuần', caution: true }
              ].map((p) => {
                const isSelected = weeklyPace === p.val;
                return (
                  <TouchableOpacity
                    key={p.val}
                    onPress={() => {
                      triggerHaptic('light');
                      setWeeklyPace(p.val);
                    }}
                    style={[
                      styles.selectionCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isSelected ? '#FF6B35' : theme.border,
                        borderWidth: isSelected ? 2 : 1
                      }
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{p.title}</Text>
                        {p.recommended && (
                          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(34, 197, 94, 0.16)' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#22C55E' }}>ĐỀ XUẤT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>{p.rate}</Text>
                    </View>
                    {p.caution && <AlertTriangle size={18} color="#F5A524" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {weeklyPace === 1.0 && (
              <View style={[styles.warningBox, { backgroundColor: 'rgba(245, 165, 36, 0.12)', borderColor: 'rgba(245, 165, 36, 0.35)' }]}>
                <AlertTriangle size={16} color="#F5A524" />
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#F5A524', lineHeight: 17 }}>
                  Tốc độ này tạo mức thâm hụt lớn. Có thể gây mệt mỏi và khó duy trì lâu dài. Khuyên dùng mức 0.5 kg/tuần.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ================= STEP: LIFESTYLE (HABITS + TIME) ================= */}
        {currentStep === 'lifestyle' && (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Thói quen của bạn</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Giúp AI gợi ý thực đơn phù hợp hơn — có thể bỏ qua.
              </Text>
            </View>

            {/* Eating Habits */}
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: theme.textTertiary }}>
                ĂN UỐNG · CHỌN NHIỀU
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { id: 'eat_out', label: 'Ăn ngoài nhiều' },
                  { id: 'home_cook', label: 'Nấu ăn ở nhà' },
                  { id: 'clean', label: 'Ăn kiêng / Clean' },
                  { id: 'vietnamese', label: 'Thích món Việt 🇻🇳' },
                  { id: 'asia_west', label: 'Món Á / Tây' },
                  { id: 'vegetarian', label: 'Ăn chay' }
                ].map((item) => {
                  const isSelected = eatingHabits.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => toggleHabit(item.id)}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: isSelected ? 'rgba(255, 107, 53, 0.14)' : theme.surface,
                          borderColor: isSelected ? '#FF6B35' : theme.border
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? '#FF6B35' : theme.text }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Commitment */}
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: theme.textTertiary }}>
                THỜI GIAN MỖI NGÀY
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { id: 'under_1min', title: '< 1 phút', sub: 'Scan nhanh' },
                  { id: '2_3min', title: '2–3 phút', sub: 'Scan + sửa' },
                  { id: '5min_plus', title: '5+ phút', sub: 'Chi tiết' }
                ].map((item) => {
                  const isSelected = timeCommitment === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        triggerHaptic('light');
                        setTimeCommitment(item.id as any);
                      }}
                      style={[
                        styles.timeSegment,
                        {
                          backgroundColor: isSelected ? theme.accent : theme.surface,
                          borderColor: isSelected ? theme.accent : theme.border
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isSelected ? theme.accentFg : theme.text }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? theme.accentFg : theme.textSecondary, opacity: 0.85 }}>
                        {item.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP: FEATURE INTEREST ================= */}
        {currentStep === 'feature' && (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>Bạn quan tâm tính năng nào?</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Chọn các tính năng bạn muốn sử dụng nhiều nhất.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { id: 'ai_scan', title: 'Scan ảnh món ăn bằng AI', icon: Camera },
                { id: 'barcode', title: 'Quét mã vạch thực phẩm', icon: Barcode },
                { id: 'text', title: 'Ghi món bằng văn bản', icon: Type },
                { id: 'apple_health', title: 'Đồng bộ Apple Health / Fit', icon: Heart },
                { id: 'progress', title: 'Xem tiến trình & Biểu đồ', icon: TrendingUp },
                { id: 'streak', title: 'Chuỗi ngày Streak & Thành tích', icon: Flame }
              ].map((item) => {
                const isSelected = interestedFeatures.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleFeature(item.id)}
                    style={[
                      styles.selectionCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isSelected ? '#FF6B35' : theme.border,
                        borderWidth: isSelected ? 2 : 1
                      }
                    ]}
                  >
                    <item.icon size={20} color={isSelected ? '#FF6B35' : theme.textSecondary} />
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.text }}>{item.title}</Text>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= STEP: CALCULATING (2.7s ANIMATED) ================= */}
        {currentStep === 'calculating' && (
          <View style={styles.calculatingContainer}>
            <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ width: 64, height: 64, transform: [{ rotate: spin }] }}>
                <Svg width={64} height={64} viewBox="0 0 64 64">
                  <Circle cx={32} cy={32} r={26} fill="none" stroke={theme.surfaceAlt} strokeWidth={5} />
                  <Circle
                    cx={32}
                    cy={32}
                    r={26}
                    fill="none"
                    stroke="#FF6B35"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray="45 155"
                  />
                </Svg>
              </Animated.View>
            </View>

            <Text style={[styles.calcHeading, { color: theme.text }]}>Đang xây kế hoạch của bạn</Text>

            <View style={{ width: '100%', maxWidth: 300, gap: 16, marginTop: 4 }}>
              <View style={[styles.calcRow, { opacity: calcTick1 ? 1 : 0.2 }]}>
                <View style={[styles.calcTickCircle, { backgroundColor: '#22C55E' }]}>
                  <Check size={13} color="#0A0A0A" strokeWidth={3.2} />
                </View>
                <Text style={[styles.calcRowText, { color: theme.text }]}>
                  Tính BMR theo Mifflin-St Jeor
                </Text>
              </View>

              <View style={[styles.calcRow, { opacity: calcTick2 ? 1 : 0.2 }]}>
                <View style={[styles.calcTickCircle, { backgroundColor: '#22C55E' }]}>
                  <Check size={13} color="#0A0A0A" strokeWidth={3.2} />
                </View>
                <Text style={[styles.calcRowText, { color: theme.text }]}>
                  Áp dụng hệ số vận động
                </Text>
              </View>

              <View style={[styles.calcRow, { opacity: calcTick3 ? 1 : 0.2 }]}>
                <View style={[styles.calcTickCircle, { backgroundColor: '#22C55E' }]}>
                  <Check size={13} color="#0A0A0A" strokeWidth={3.2} />
                </View>
                <Text style={[styles.calcRowText, { color: theme.text }]}>
                  Phân bổ macro theo mục tiêu
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP: CALCULATED PLAN ================= */}
        {currentStep === 'plan' && calculatedGoals && (() => {
          const displayKcal = Math.round((calculatedGoals.targetCalories * planAnimVal) / 5) * 5;
          const displayProtein = Math.round(calculatedGoals.targetProtein * planAnimVal);
          const displayCarbs = Math.round(calculatedGoals.targetCarbs * planAnimVal);
          const displayFat = Math.round(calculatedGoals.targetFat * planAnimVal);

          // SVG curve calculation
          const w0 = weightKg;
          const w1 = targetWeightKg;
          const hi = Math.max(w0, w1);
          const lo = Math.min(w0, w1);
          const span = Math.max(1, hi - lo);
          const yOf = (w: number) => 14 + ((hi - w) / span) * 62;

          const pts: [number, number][] = [];
          for (let i = 0; i <= 6; i++) {
            const p = i / 6;
            const e = 1 - Math.pow(1 - p, 1.7);
            pts.push([6 + p * 288, yOf(w0 + (w1 - w0) * e)]);
          }

          const y0 = yOf(w0);
          const y1 = yOf(w1);
          const linePath = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
          const areaPath = linePath + ' L294 96 L6 96 Z';

          return (
            <View style={{ gap: 16 }}>
              <View style={{ gap: 4 }}>
                <Text style={[styles.largeTitle, { color: theme.text }]}>Kế hoạch dành riêng cho bạn</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Dựa trên công thức Mifflin-St Jeor + mức vận động của bạn.
                </Text>
              </View>

              {/* Calorie Card */}
              <View style={[styles.planCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ position: 'relative', width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={168} height={168} viewBox="0 0 168 168">
                    <Circle cx={84} cy={84} r={70} fill="none" stroke={theme.surfaceAlt} strokeWidth={14} />
                    <Circle
                      cx={84}
                      cy={84}
                      r={70}
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth={14}
                      strokeLinecap="round"
                      strokeDasharray={`${374 * planAnimVal} 440`}
                      transform="rotate(-90 84 84)"
                    />
                  </Svg>
                  <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 40, fontWeight: '900', color: theme.text, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>
                      {displayKcal}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginTop: 2 }}>
                      kcal / ngày
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <View style={[styles.metaPill, { backgroundColor: theme.surfaceAlt }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>BMR {bmr}</Text>
                  </View>
                  <View style={[styles.metaPill, { backgroundColor: theme.surfaceAlt }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>TDEE {tdee}</Text>
                  </View>
                </View>
              </View>

              {/* 3 Macro Rings Row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Protein Card */}
                <View style={[styles.macroBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Svg width={54} height={54} viewBox="0 0 54 54">
                    <Circle cx={27} cy={27} r={21} fill="none" stroke={theme.surfaceAlt} strokeWidth={6} />
                    <Circle
                      cx={27}
                      cy={27}
                      r={21}
                      fill="none"
                      stroke="#E5484D"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={`${(2 * Math.PI * 21 * 0.35 * Math.min(1, planAnimVal * 1.2)).toFixed(1)} 132`}
                      transform="rotate(-90 27 27)"
                    />
                  </Svg>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>{displayProtein}g</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.5 }}>PROTEIN</Text>
                </View>

                {/* Carbs Card */}
                <View style={[styles.macroBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Svg width={54} height={54} viewBox="0 0 54 54">
                    <Circle cx={27} cy={27} r={21} fill="none" stroke={theme.surfaceAlt} strokeWidth={6} />
                    <Circle
                      cx={27}
                      cy={27}
                      r={21}
                      fill="none"
                      stroke="#F5A524"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={`${(2 * Math.PI * 21 * 0.45 * Math.min(1, planAnimVal * 1.2)).toFixed(1)} 132`}
                      transform="rotate(-90 27 27)"
                    />
                  </Svg>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>{displayCarbs}g</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.5 }}>CARBS</Text>
                </View>

                {/* Fat Card */}
                <View style={[styles.macroBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Svg width={54} height={54} viewBox="0 0 54 54">
                    <Circle cx={27} cy={27} r={21} fill="none" stroke={theme.surfaceAlt} strokeWidth={6} />
                    <Circle
                      cx={27}
                      cy={27}
                      r={21}
                      fill="none"
                      stroke="#3E7BFA"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={`${(2 * Math.PI * 21 * 0.25 * Math.min(1, planAnimVal * 1.2)).toFixed(1)} 132`}
                      transform="rotate(-90 27 27)"
                    />
                  </Svg>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>{displayFat}g</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.5 }}>FAT</Text>
                </View>
              </View>

              {/* SVG Weight Forecast Box */}
              {etaDateStr && goal !== 'maintain' && (
                <View style={[styles.forecastBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>Dự báo cân nặng</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#22C55E' }}>Mục tiêu: {etaDateStr}</Text>
                  </View>

                  <View style={{ width: '100%', height: 96, marginVertical: 6 }}>
                    <Svg width="100%" height={96} viewBox="0 0 300 96">
                      <Defs>
                        <SvgLinearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.22" />
                          <Stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                        </SvgLinearGradient>
                      </Defs>
                      <Path d={areaPath} fill="url(#forecastGrad)" />
                      <Path d={linePath} fill="none" stroke="#22C55E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      <Circle cx={6} cy={y0} r={4.5} fill="#22C55E" />
                      <Circle cx={294} cy={y1} r={4.5} fill="#22C55E" />
                    </Svg>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>{w0} kg · hôm nay</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#22C55E' }}>{w1} kg · {etaDateStr}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })()}

        {/* ================= STEP: PREVIEW ================= */}
        {currentStep === 'preview' && (
          <View style={{ gap: 18, paddingTop: 10 }}>
            <Text style={[styles.largeTitle, { color: theme.text }]}>Sẵn sàng trải nghiệm chưa?</Text>

            <View style={{ gap: 12 }}>
              <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.previewNum, { backgroundColor: 'rgba(255, 107, 53, 0.15)' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#FF6B35' }}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Chụp ảnh món ăn</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                    Một tấm là đủ, không cần cân đo phức tạp
                  </Text>
                </View>
              </View>

              <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.previewNum, { backgroundColor: 'rgba(62, 123, 250, 0.15)' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#3E7BFA' }}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>AI phân tích trong vài giây</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                    Nhận diện món Việt, đối chiếu chuẩn VN FCT
                  </Text>
                </View>
              </View>

              <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.previewNum, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#22C55E' }}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Tự động cộng vào nhật ký</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                    Calo và macro cập nhật tức thì
                  </Text>
                </View>
              </View>
            </View>

            <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 10 }}>
              Chỉ cần 1 tấm ảnh, mọi thứ đã sẵn sàng!
            </Text>
          </View>
        )}
        </Animated.View>
      </ScrollView>

      {/* 3. Sticky Bottom CTA Bar */}
      {currentStep !== 'calculating' && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: themeMode === 'dark' ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.92)',
              borderTopColor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              borderTopWidth: 1
            }
          ]}
        >
          <TouchableOpacity
            onPress={goToNextStep}
            activeOpacity={0.88}
            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.accentFg }]}>
              {currentStep === 'preview'
                ? 'Bắt đầu dùng CalorieIQ'
                : currentStep === 'plan'
                ? 'Kế hoạch này hợp lý'
                : 'Tiếp tục'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  navBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6
  },
  segTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    overflow: 'hidden'
  },
  segFill: {
    height: '100%',
    borderRadius: 999
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 6
  },
  scrollArea: {
    flex: 1
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 34
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20
  },
  promiseBox: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18
  },
  symbolBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18
  },
  dotMeter: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  timeSegment: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2
  },
  calculatingContainer: {
    paddingTop: 100,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28
  },
  calcHeading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  calcTickCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  calcRowText: {
    fontSize: 14,
    fontWeight: '700'
  },
  planCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 22,
    borderWidth: 1
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4
  },
  forecastBox: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12
  },
  forecastLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    opacity: 0.6
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1
  },
  previewNum: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36
  },
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800'
  }
});
