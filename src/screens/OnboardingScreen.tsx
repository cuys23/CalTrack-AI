import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, Check, Sparkles, Trophy } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { RulerPicker } from '../components/RulerPicker';
import { CalorieRing, MacroRing } from '../components/CalorieRing';
import { triggerHaptic } from '../utils/haptics';
import { UserGoals } from '../types';

interface OnboardingScreenProps {
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const { theme, calculateAndApplyPlan } = useApp();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form states
  const [gender, setGender] = useState<'female' | 'male' | 'other'>('female');
  const [age, setAge] = useState(24);
  const [heightCm, setHeightCm] = useState(165);
  const [weightKg, setWeightKg] = useState(65.4);
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('lose');
  const [targetWeight, setTargetWeight] = useState(57.0);
  const [calculatedPlan, setCalculatedPlan] = useState<UserGoals | null>(null);

  const goNext = () => {
    triggerHaptic('light');
    if (step === 5) {
      // Calculate real plan before step 6
      const plan = calculateAndApplyPlan({
        gender,
        age,
        heightCm,
        currentWeightKg: weightKg,
        targetWeightKg: targetWeight,
        activityLevel: 'moderate',
        goal,
        weeklyPace: 0.75,
        dietType: 'standard'
      });
      setCalculatedPlan(plan);
      setStep(6);
    } else if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      triggerHaptic('success');
      onFinish();
    }
  };

  const goBack = () => {
    if (step > 1) {
      triggerHaptic('light');
      setStep((prev) => prev - 1);
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {step > 1 ? (
          <TouchableOpacity onPress={goBack} style={[styles.backBtn, { backgroundColor: theme.surfaceAlt }]}>
            <ChevronLeft size={20} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary }}>
          Bước {step} / {totalSteps}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
      </View>

      {/* Step Contents */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Step 1: Gender */}
        {step === 1 && (
          <View style={{ gap: 14 }}>
            <Text style={[styles.h1, { color: theme.text }]}>Giới tính sinh học?</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 8 }}>
              Dùng để tính toán chính xác mức tiêu hao năng lượng cơ bản (BMR).
            </Text>

            {(['female', 'male', 'other'] as const).map((g) => {
              const isSelected = gender === g;
              const label = g === 'female' ? '👩 Nữ giới' : g === 'male' ? '👨 Nam giới' : '✨ Khác / Không tiết lộ';
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => {
                    setGender(g);
                    goNext();
                  }}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected ? theme.surfaceAlt : theme.surface,
                      borderColor: isSelected ? theme.accent : theme.border
                    }
                  ]}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{label}</Text>
                  {isSelected && <Check size={18} color={theme.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <View style={{ gap: 14, alignItems: 'center' }}>
            <Text style={[styles.h1, { color: theme.text, width: '100%' }]}>Bạn bao nhiêu tuổi?</Text>
            <RulerPicker min={13} max={90} value={age} onChange={setAge} unit="tuổi" />
          </View>
        )}

        {/* Step 3: Height & Weight */}
        {step === 3 && (
          <View style={{ gap: 14 }}>
            <Text style={[styles.h1, { color: theme.text }]}>Chiều cao & Cân nặng</Text>
            <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Chiều cao (cm)</Text>
            <RulerPicker min={130} max={210} value={heightCm} onChange={setHeightCm} unit="cm" />

            <Text style={{ color: theme.textSecondary, fontWeight: '700', marginTop: 10 }}>Cân nặng hiện tại (kg)</Text>
            <RulerPicker min={40} max={150} value={weightKg} onChange={setWeightKg} unit="kg" />
          </View>
        )}

        {/* Step 4: Goal */}
        {step === 4 && (
          <View style={{ gap: 12 }}>
            <Text style={[styles.h1, { color: theme.text }]}>Mục tiêu của bạn?</Text>

            <TouchableOpacity
              onPress={() => {
                setGoal('lose');
                goNext();
              }}
              style={[styles.optionCard, { backgroundColor: goal === 'lose' ? theme.surfaceAlt : theme.surface, borderColor: goal === 'lose' ? theme.accent : theme.border }]}
            >
              <Text style={{ fontSize: 26, marginRight: 12 }}>📉</Text>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Giảm cân</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>Thâm hụt calo an toàn, giữ cơ bắp</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setGoal('maintain');
                goNext();
              }}
              style={[styles.optionCard, { backgroundColor: goal === 'maintain' ? theme.surfaceAlt : theme.surface, borderColor: goal === 'maintain' ? theme.accent : theme.border }]}
            >
              <Text style={{ fontSize: 26, marginRight: 12 }}>⚖️</Text>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Giữ cân</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>Cân bằng năng lượng và sức bền</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setGoal('gain');
                goNext();
              }}
              style={[styles.optionCard, { backgroundColor: goal === 'gain' ? theme.surfaceAlt : theme.surface, borderColor: goal === 'gain' ? theme.accent : theme.border }]}
            >
              <Text style={{ fontSize: 26, marginRight: 12 }}>📈</Text>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Tăng cơ / Tăng cân</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>Dư thừa calo nhẹ kết hợp tập luyện</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5: Target Weight */}
        {step === 5 && (
          <View style={{ gap: 12, alignItems: 'center' }}>
            <Text style={[styles.h1, { color: theme.text, width: '100%' }]}>Cân nặng mục tiêu?</Text>
            <Text style={{ color: theme.textSecondary, width: '100%', marginBottom: 10 }}>
              Cân nặng hiện tại: {weightKg} kg (Chênh lệch: {Math.abs(weightKg - targetWeight).toFixed(1)} kg)
            </Text>
            <RulerPicker min={40} max={140} value={targetWeight} onChange={setTargetWeight} unit="kg" />
          </View>
        )}

        {/* Step 6: Result Plan */}
        {step === 6 && calculatedPlan && (
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ color: theme.success, fontWeight: '800', fontSize: 12 }}>KẾ HOẠCH BMR ĐÃ SẴN SÀNG</Text>
            </View>

            <Text style={[styles.h1, { color: theme.text, textAlign: 'center' }]}>Kế hoạch Calo & Macro</Text>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 14 }}>
              Dự kiến đạt {targetWeight} kg vào khoảng {calculatedPlan.targetDate}.
            </Text>

            <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <CalorieRing size={130} target={calculatedPlan.targetCalories} consumed={0} showSubText={false} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginTop: 8 }}>kcal mỗi ngày</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <MacroRing type="protein" target={calculatedPlan.targetProtein} consumed={calculatedPlan.targetProtein} size={48} />
              <MacroRing type="carbs" target={calculatedPlan.targetCarbs} consumed={calculatedPlan.targetCarbs} size={48} />
              <MacroRing type="fat" target={calculatedPlan.targetFat} consumed={calculatedPlan.targetFat} size={48} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Continue Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={goNext}
          style={[styles.continueBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={{ color: theme.accentFg, fontSize: 16, fontWeight: '800' }}>
            {step === totalSteps ? 'Bắt đầu sử dụng' : 'Tiếp tục'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  track: { width: '100%', height: 4, marginTop: 10 },
  fill: { height: '100%' },
  h1: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  optionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 18, borderWidth: 1 },
  resultCard: { width: '100%', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1 },
  bottomBar: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  continueBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }
});
