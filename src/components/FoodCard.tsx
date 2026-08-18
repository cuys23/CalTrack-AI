import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Trash2, Bookmark } from 'lucide-react-native';
import { FoodItem } from '../types';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface FoodCardProps {
  food: FoodItem;
  onPress?: () => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, onPress }) => {
  const { theme, deleteFoodLog } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        {/* Food Thumbnail Image */}
        <Image
          source={{ uri: food.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' }}
          style={styles.image}
        />

        {/* Details */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {food.name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <Clock size={11} color={theme.textTertiary} />
            <Text style={{ fontSize: 12, color: theme.textTertiary }}>{food.time}</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>• {food.portion} {food.portionUnit}</Text>
          </View>

          {/* 3 Macro indicator dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={[styles.dot, { backgroundColor: theme.protein }]} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.protein }}>{food.macros.protein}g</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={[styles.dot, { backgroundColor: theme.carbs }]} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.carbs }}>{food.macros.carbs}g</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={[styles.dot, { backgroundColor: theme.fat }]} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.fat }}>{food.macros.fat}g</Text>
            </View>
          </View>
        </View>

        {/* Calories & Delete Action */}
        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={[styles.calorieNumber, { color: theme.text }]}>{food.calories}</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary }}>kcal</Text>

          <TouchableOpacity
            onPress={() => deleteFoodLog(food.id)}
            style={{ padding: 4, marginTop: 4 }}
          >
            <Trash2 size={15} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const DateStrip: React.FC = () => {
  const { theme, selectedDate, setSelectedDate, foodLogs } = useApp();

  const baseDate = new Date(selectedDate);
  const days: { dateStr: string; dayName: string; dayNum: number; hasLog: boolean }[] = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = -3; i <= 3; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const hasLog = (foodLogs || []).some((f) => f && f.date === dateStr);
    days.push({
      dateStr,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
      hasLog
    });
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
      {days.map((item) => {
        const isSelected = item.dateStr === selectedDate;
        return (
          <TouchableOpacity
            key={item.dateStr}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('light');
              setSelectedDate(item.dateStr);
            }}
            style={[
              styles.datePill,
              {
                backgroundColor: isSelected ? theme.accent : 'transparent',
                borderColor: isSelected ? theme.accent : 'transparent'
              }
            ]}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? theme.accentFg : theme.textSecondary }}>
              {item.dayName}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: isSelected ? theme.accentFg : theme.text, marginTop: 2 }}>
              {item.dayNum}
            </Text>
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                marginTop: 4,
                backgroundColor: isSelected ? theme.accentFg : item.hasLog ? theme.accent : 'transparent'
              }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 12
  },
  title: {
    fontSize: 15,
    fontWeight: '700'
  },
  calorieNumber: {
    fontSize: 16,
    fontWeight: '800'
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  datePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1
  }
});
