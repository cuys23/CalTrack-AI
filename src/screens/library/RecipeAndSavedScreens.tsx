import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { ChevronLeft, Plus, Bookmark, Link2, Sparkles, Heart, Trash2 } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { FoodItem } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

// 2.9 Food Detail Screen
export const FoodDetailScreen: React.FC<{ food: FoodItem; onBack: () => void; onSave: () => void }> = ({ food, onBack, onSave }) => {
  const { theme } = useApp();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]} numberOfLines={1}>{food.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <Image source={{ uri: food.imageUrl }} style={{ width: '100%', height: 200, borderRadius: 20, marginBottom: 16 }} />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>{food.calories} kcal</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary }}>1 {food.portionUnit} {food.portionGrams ? `(${food.portionGrams}g)` : ''}</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 14 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.protein }}>{food.macros.protein}g</Text>
            <Text style={{ fontSize: 11, color: theme.textTertiary }}>Protein</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.carbs }}>{food.macros.carbs}g</Text>
            <Text style={{ fontSize: 11, color: theme.textTertiary }}>Carbs</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.fat }}>{food.macros.fat}g</Text>
            <Text style={{ fontSize: 11, color: theme.textTertiary }}>Fat</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={onSave} style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 20 }]}>
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Thêm vào bữa ăn</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 2.10 Create Food Screen
export const CreateFoodScreen: React.FC<{ onCreated: (food: FoodItem) => void; onBack: () => void }> = ({ onCreated, onBack }) => {
  const { theme, showToast } = useApp();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [unit, setUnit] = useState('phần');

  const handleCreate = () => {
    if (!name.trim()) return;
    triggerHaptic('success');
    const newFood: FoodItem = {
      id: 'custom-' + Date.now(),
      name,
      mealType: 'lunch',
      time: '12:00',
      date: new Date().toISOString().split('T')[0],
      calories: parseInt(calories) || 0,
      portion: 1,
      portionUnit: unit,
      macros: {
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0
      },
      healthScore: 8.0,
      confidence: 'high',
      source: 'user_edited',
      fkbSourceLabel: 'Món ăn tự tạo'
    };
    onCreated(newFood);
    showToast(`Đã tạo món "${name}"`);
    onBack();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Tạo món ăn mới</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, gap: 10 }]}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary }}>Tên món ăn</Text>
        <TextInput value={name} onChangeText={setName} placeholder="VD: Sinh tố bơ chuối..." placeholderTextColor={theme.textTertiary} style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} />

        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginTop: 6 }}>Calo (kcal)</Text>
        <TextInput keyboardType="numeric" value={calories} onChangeText={setCalories} placeholder="VD: 320" placeholderTextColor={theme.textTertiary} style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} />

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.protein }}>Protein (g)</Text>
            <TextInput keyboardType="numeric" value={protein} onChangeText={setProtein} style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.carbs }}>Carbs (g)</Text>
            <TextInput keyboardType="numeric" value={carbs} onChangeText={setCarbs} style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.fat }}>Fat (g)</Text>
            <TextInput keyboardType="numeric" value={fat} onChangeText={setFat} style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} />
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleCreate} style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 20 }]}>
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Tạo và Lưu món ăn</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 2.11 Saved Meals Screen
export const SavedMealsScreen: React.FC<{ onSelectFood: (food: FoodItem) => void; onBack: () => void }> = ({ onSelectFood, onBack }) => {
  const { theme, savedMeals } = useApp();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Món ăn & Bữa ăn đã lưu</Text>
        <View style={{ width: 36 }} />
      </View>

      {(savedMeals || []).map((food) => (
        <TouchableOpacity
          key={food.id}
          onPress={() => {
            triggerHaptic('light');
            onSelectFood(food);
          }}
          style={[styles.savedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Image source={{ uri: food.imageUrl }} style={{ width: 48, height: 48, borderRadius: 10 }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{food.name}</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{food.calories} kcal • {food.portion} {food.portionUnit}</Text>
          </View>
          <Bookmark size={18} color="#FF6B35" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '800' },
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  savedCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 15 },
  btnPrimary: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
});
