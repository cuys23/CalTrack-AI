import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Plus, Minus, Check, Bookmark, Trash2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react-native';
import { FoodItem, MealType } from '../types';
import { useApp } from '../context/AppContext';
import { MacroRing } from '../components/CalorieRing';
import { HealthScoreGauge } from '../components/RulerPicker';
import { triggerHaptic } from '../utils/haptics';

interface FoodResultScreenProps {
  foodItem: FoodItem;
  onSave: (food: FoodItem) => void;
  onFix?: () => void;
  onClose: () => void;
}

export const FoodResultScreen: React.FC<FoodResultScreenProps> = ({ foodItem, onSave, onFix, onClose }) => {
  const { theme } = useApp();
  const [food, setFood] = useState<FoodItem>(foodItem);

  const handlePortion = (delta: number) => {
    triggerHaptic('tick');
    const newPortion = Math.max(0.25, +(food.portion + delta).toFixed(2));
    const factor = newPortion / food.portion;

    setFood((prev) => ({
      ...prev,
      portion: newPortion,
      portionGrams: prev.portionGrams ? Math.round(prev.portionGrams * factor) : undefined,
      calories: Math.round(prev.calories * factor),
      macros: {
        protein: Math.round(prev.macros.protein * factor),
        carbs: Math.round(prev.macros.carbs * factor),
        fat: Math.round(prev.macros.fat * factor)
      }
    }));
  };

  const handleRemoveIngredient = (id: string) => {
    triggerHaptic('delete');
    setFood((prev) => ({
      ...prev,
      ingredients: prev.ingredients?.filter((i) => i.id !== id)
    }));
  };

  const isVerified = food.source === 'verified';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Hero Image 280px */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: food.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' }}
          style={styles.heroImage}
        />
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={20} color="#fff" />
        </TouchableOpacity>
        {onFix && (
          <TouchableOpacity onPress={onFix} style={styles.fixBtn}>
            <Sparkles size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 5 }}>AI đoán chưa đúng?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Overlaid Card */}
      <ScrollView style={{ flex: 1, marginTop: -28, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header & Source Verification Badge */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.dishTitle, { color: theme.text }]} numberOfLines={1}>
                {food.name}
              </Text>
              {/* Verification Source Badge (NutriScan Pattern) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <ShieldCheck size={13} color={isVerified ? theme.success : theme.warning} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isVerified ? theme.success : theme.warning }}>
                  {food.fkbSourceLabel || (isVerified ? 'Chuẩn Viện Dinh Dưỡng VN' : 'Ước lượng AI')}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.success }}>Độ tin cậy: Cao</Text>
            </View>
          </View>

          {/* Stepper Portion Row with Grams */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.stepper, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <TouchableOpacity onPress={() => handlePortion(-0.5)} style={styles.stepperBtn}>
                  <Minus size={14} color={theme.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text, minWidth: 32, textAlign: 'center' }}>
                  {food.portion}
                </Text>
                <TouchableOpacity onPress={() => handlePortion(0.5)} style={styles.stepperBtn}>
                  <Plus size={14} color={theme.text} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>{food.portionUnit}</Text>
            </View>

            {food.portionGrams && (
              <View style={{ backgroundColor: theme.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>≈ {food.portionGrams}g</Text>
              </View>
            )}
          </View>

          {/* Calories & Macro Rings */}
          <View style={[styles.calorieRow, { borderColor: theme.border }]}>
            <View>
              <Text style={[styles.bigKcal, { color: theme.text }]}>{food.calories}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>kcal</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MacroRing type="protein" target={50} consumed={food.macros.protein} size={46} />
              <MacroRing type="carbs" target={70} consumed={food.macros.carbs} size={46} />
              <MacroRing type="fat" target={25} consumed={food.macros.fat} size={46} />
            </View>
          </View>

          {/* Health Score Gauge */}
          <HealthScoreGauge score={food.healthScore} />

          {/* Ingredients List */}
          {food.ingredients && food.ingredients.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 8 }}>
                Nguyên liệu đối chiếu FKB ({food.ingredients.length})
              </Text>
              {food.ingredients.map((ing) => (
                <View key={ing.id} style={[styles.ingItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{ing.name}</Text>
                    <Text style={{ fontSize: 11, color: theme.textTertiary }}>{ing.amount} • {ing.calories} kcal</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveIngredient(ing.id)}>
                    <Trash2 size={15} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Meal Slot Selection */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 8 }}>Chọn bữa ăn:</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => {
                const label = m === 'breakfast' ? 'Sáng' : m === 'lunch' ? 'Trưa' : m === 'dinner' ? 'Tối' : 'Vặt';
                const isSelected = food.mealType === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                      triggerHaptic('light');
                      setFood((prev) => ({ ...prev, mealType: m }));
                    }}
                    style={[styles.mealPill, { backgroundColor: isSelected ? theme.accent : theme.surfaceAlt }]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? theme.accentFg : theme.textSecondary }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Medical & Nutrition Compliance Disclaimer */}
          <View style={{ marginTop: 16, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <AlertCircle size={14} color={theme.textTertiary} style={{ marginTop: 2 }} />
            <Text style={{ fontSize: 11, color: theme.textTertiary, flex: 1, lineHeight: 15 }}>
              Số liệu dinh dưỡng tham khảo đối chiếu theo Bảng thành phần thực phẩm Việt Nam (VN FCT) và USDA FoodData Central.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('success');
            onSave(food);
          }}
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={{ color: theme.accentFg, fontSize: 16, fontWeight: '800' }}>Thêm vào nhật ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { width: '100%', height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  closeBtn: { position: 'absolute', top: 50, left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  fixBtn: { position: 'absolute', top: 50, right: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.5)' },
  card: { padding: 20, borderRadius: 24, borderWidth: 1 },
  dishTitle: { fontSize: 20, fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 3 },
  stepperBtn: { padding: 8 },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, marginVertical: 14 },
  bigKcal: { fontSize: 36, fontWeight: '900' },
  ingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  mealPill: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  bottomBar: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  saveBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }
});
