import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Flame, Plus, Footprints, ChevronRight } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { CalorieRing } from '../components/CalorieRing';
import { MacroRing } from '../components/CalorieRing';
import { DateStrip, FoodCard } from '../components/FoodCard';
import { triggerHaptic } from '../utils/haptics';

interface HomeScreenProps {
  onOpenScan: () => void;
  onOpenProgress: () => void;
  onOpenProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenScan, onOpenProgress, onOpenProfile }) => {
  const { theme, userProfile, userGoals, foodLogs, selectedDate, exercises } = useApp();

  const todayFoodLogs = (foodLogs || []).filter((f) => f && f.date === selectedDate);
  const totalCalories = todayFoodLogs.reduce((sum, f) => sum + (f.calories || 0), 0);
  const totalProtein = todayFoodLogs.reduce((sum, f) => sum + (f.macros?.protein || 0), 0);
  const totalCarbs = todayFoodLogs.reduce((sum, f) => sum + (f.macros?.carbs || 0), 0);
  const totalFat = todayFoodLogs.reduce((sum, f) => sum + (f.macros?.fat || 0), 0);

  const todayExercises = (exercises || []).filter((e) => e && e.date === selectedDate);
  const totalBurned = todayExercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);

  const mealSections = [
    { type: 'breakfast', title: 'Bữa sáng' },
    { type: 'lunch', title: 'Bữa trưa' },
    { type: 'dinner', title: 'Bữa tối' },
    { type: 'snack', title: 'Ăn vặt & Đồ uống' }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      {/* 1. Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.brandBadge}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>C</Text>
          </View>
          <Text style={[styles.brandTitle, { color: theme.text }]}>CalTrack AI</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Flame Streak Chip */}
          <View style={[styles.streakChip, { backgroundColor: 'rgba(255, 107, 53, 0.14)', borderColor: 'rgba(255, 107, 53, 0.3)' }]}>
            <Flame size={16} color={theme.streak} />
            <Text style={{ color: theme.streak, fontWeight: '800', fontSize: 13 }}>{userProfile.streakCount}</Text>
          </View>

          {/* Avatar */}
          <TouchableOpacity onPress={onOpenProfile} style={[styles.avatar, { borderColor: theme.border }]}>
            <Image source={{ uri: userProfile.avatarUrl }} style={{ width: '100%', height: '100%' }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. DateStrip */}
      <DateStrip />

      {/* 3. Main Calorie Card */}
      <View style={[styles.calorieCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <CalorieRing
          size={140}
          target={userGoals.targetCalories}
          consumed={totalCalories}
          burned={totalBurned}
        />

        <View style={{ flex: 1, marginLeft: 16, gap: 6 }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            Mục tiêu: <Text style={{ color: theme.text, fontWeight: '700' }}>{userGoals.targetCalories}</Text> kcal
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>
            Đã nạp: <Text style={{ color: theme.text, fontWeight: '700' }}>{totalCalories}</Text> kcal
          </Text>
          <Text style={{ fontSize: 13, color: theme.success, fontWeight: '700' }}>
            Đã đốt: +{totalBurned} kcal
          </Text>
        </View>
      </View>

      {/* 4. 3 Macro Rings Card */}
      <View style={[styles.macroRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MacroRing type="protein" target={userGoals.targetProtein} consumed={totalProtein} size={48} />
        <MacroRing type="carbs" target={userGoals.targetCarbs} consumed={totalCarbs} size={48} />
        <MacroRing type="fat" target={userGoals.targetFat} consumed={totalFat} size={48} />
      </View>

      {/* 5. Health & Steps Card */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenProgress}
        style={[styles.stepsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(62, 123, 250, 0.15)' }]}>
            <Footprints size={18} color={theme.fat} />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>8,432 bước chân</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>+{totalBurned} kcal đã đốt (Apple Health)</Text>
          </View>
        </View>
        <ChevronRight size={16} color={theme.textTertiary} />
      </TouchableOpacity>

      {/* 6. Today Meals Section */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Nhật ký ăn uống</Text>

      {mealSections.map((sec) => {
        const items = todayFoodLogs.filter((f) => f.mealType === sec.type);
        const mealKcal = items.reduce((sum, f) => sum + f.calories, 0);

        return (
          <View key={sec.type} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                {sec.title} {mealKcal > 0 && <Text style={{ color: theme.textSecondary }}>({mealKcal} kcal)</Text>}
              </Text>

              <TouchableOpacity
                onPress={onOpenScan}
                style={[styles.addBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Plus size={13} color={theme.text} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, marginLeft: 3 }}>Thêm</Text>
              </TouchableOpacity>
            </View>

            {items.length > 0 ? (
              items.map((food, idx) => <FoodCard key={food.id || `food-${idx}`} food={food} />)
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onOpenScan}
                style={[styles.emptyMeal, { borderColor: theme.border }]}
              >
                <Text style={{ fontSize: 13, color: theme.textTertiary }}>Chưa ghi {sec.title.toLowerCase()}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.accent }}>+ Quét món ngay</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  brandBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 18, fontWeight: '800' },
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, overflow: 'hidden' },
  calorieCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  stepsCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  emptyMeal: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed' }
});
