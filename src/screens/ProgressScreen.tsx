import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronLeft, Plus, ArrowDownRight, Award, Shield, Moon, Sun, Scale, TrendingDown, Eye } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { RulerPicker } from '../components/RulerPicker';
import { triggerHaptic } from '../utils/haptics';

interface ProgressScreenProps {
  onBack: () => void;
  onOpenCompare?: () => void;
  onOpenWeeklyReport?: () => void;
  onOpenMeasurements?: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  onBack,
  onOpenCompare,
  onOpenWeeklyReport,
  onOpenMeasurements,
}) => {
  const { theme, userProfile, userGoals, weightLogs, foodLogs, addWeightLog } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);
  const [inputWeight, setInputWeight] = useState(userProfile.currentWeightKg || 65.4);

  // 1. BMI Calculation
  const heightM = (userProfile.heightCm || 165) / 100;
  const bmi = +(userProfile.currentWeightKg / (heightM * heightM)).toFixed(1);
  const bmiCategory = bmi < 18.5 ? 'Thiếu cân' : bmi < 24.9 ? 'Chuẩn thể trạng' : bmi < 29.9 ? 'Thừa cân' : 'Béo phì';
  const bmiColor = bmi < 18.5 ? '#F59E0B' : bmi < 24.9 ? '#22C55E' : '#E5484D';

  // 2. Weight Loss metrics
  const sortedWeights = [...(weightLogs || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const initialWeight = sortedWeights.length > 0 ? sortedWeights[0].weight : userProfile.currentWeightKg;
  const currentWeight = userProfile.currentWeightKg;
  const weightChange = +(currentWeight - initialWeight).toFixed(1);

  // 3. Average Nutrition from real food logs
  const totalKcal = (foodLogs || []).reduce((sum, f) => sum + (f.calories || 0), 0);
  const avgKcal = foodLogs.length > 0 ? Math.round(totalKcal / Math.max(1, new Set(foodLogs.map((f) => f.date)).size)) : 1750;

  const totalProtein = (foodLogs || []).reduce((sum, f) => sum + (f.macros?.protein || 0), 0);
  const avgProtein = foodLogs.length > 0 ? Math.round(totalProtein / Math.max(1, new Set(foodLogs.map((f) => f.date)).size)) : 130;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Tiến trình & Cân nặng</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Weight Summary Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>Cân nặng hiện tại</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <Text style={{ fontSize: 34, fontWeight: '900', color: theme.text }}>{currentWeight}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textSecondary }}>kg</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <ArrowDownRight size={15} color={weightChange <= 0 ? theme.success : theme.danger} />
              <Text style={{ color: weightChange <= 0 ? theme.success : theme.danger, fontSize: 13, fontWeight: '700' }}>
                {weightChange <= 0 ? `−${Math.abs(weightChange)}` : `+${weightChange}`} kg (Mục tiêu: {userGoals.targetWeight} kg)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowLogModal(!showLogModal)}
            style={[styles.primaryBtnSmall, { backgroundColor: theme.accent }]}
          >
            <Plus size={14} color={theme.accentFg} />
            <Text style={{ color: theme.accentFg, fontSize: 12, fontWeight: '800', marginLeft: 4 }}>Ghi cân</Text>
          </TouchableOpacity>
        </View>

        {/* BMI Bar */}
        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: theme.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Chỉ số BMI: {bmi}</Text>
            <View style={{ backgroundColor: `${bmiColor}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: bmiColor }}>{bmiCategory}</Text>
            </View>
          </View>
        </View>

        {showLogModal && (
          <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: theme.border, paddingTop: 14 }}>
            <RulerPicker min={40} max={140} value={inputWeight} onChange={setInputWeight} />
            <TouchableOpacity
              onPress={() => {
                addWeightLog(inputWeight);
                setShowLogModal(false);
              }}
              style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Lưu cân nặng {inputWeight} kg</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4 Average Stat Boxes */}
      <View style={styles.grid2x2}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('light');
            if (onOpenWeeklyReport) onOpenWeeklyReport();
          }}
          style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>Calo TB / ngày</Text>
          <Text style={[styles.statNum, { color: theme.text }]}>{avgKcal} kcal</Text>
          <Text style={{ fontSize: 10, color: theme.success, marginTop: 2 }}>Mục tiêu: {userGoals.targetCalories} kcal ↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('light');
            if (onOpenWeeklyReport) onOpenWeeklyReport();
          }}
          style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>Protein TB</Text>
          <Text style={[styles.statNum, { color: theme.protein }]}>{avgProtein}g</Text>
          <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>Mục tiêu: {userGoals.targetProtein}g ↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('light');
            if (onOpenWeeklyReport) onOpenWeeklyReport();
          }}
          style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>Tổng số bữa đã ghi</Text>
          <Text style={[styles.statNum, { color: theme.text }]}>{userProfile.totalLoggedMeals || (foodLogs || []).length} bữa</Text>
          <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>{userProfile.appDaysCount || 24} ngày dùng app</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic('light');
            if (onOpenWeeklyReport) onOpenWeeklyReport();
          }}
          style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>Streak dài nhất</Text>
          <Text style={[styles.statNum, { color: theme.streak }]}>🔥 {userProfile.longestStreak} ngày</Text>
          <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>Hiện tại: {userProfile.streakCount} ngày</Text>
        </TouchableOpacity>
      </View>

      {/* Weight History Timeline */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Lịch sử ghi cân ({weightLogs.length})</Text>
        {weightLogs.slice(0, 5).map((w, idx) => (
          <View key={w.id || idx} style={[styles.weightRow, { borderBottomColor: theme.border }]}>
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>{w.date}</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>{w.weight} kg</Text>
          </View>
        ))}
      </View>

      {/* Progress Photos Preview */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Ảnh tiến trình</Text>
          {onOpenCompare && (
            <TouchableOpacity onPress={onOpenCompare}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>So sánh Trước/Sau →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={styles.photoThumb}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80' }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            <Text style={styles.photoLabel}>18/07 • 67.5kg</Text>
          </View>
          <View style={styles.photoThumb}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
            <Text style={styles.photoLabel}>Hôm nay • {currentWeight}kg</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '800' },
  card: { padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 14 },
  primaryBtnSmall: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  saveBtn: { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  grid2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statBox: { width: '48.5%', padding: 12, borderRadius: 16, borderWidth: 1 },
  statNum: { fontSize: 18, fontWeight: '800', marginTop: 3 },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  photoThumb: { flex: 1, height: 130, position: 'relative', borderRadius: 12 },
  photoLabel: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }
});
