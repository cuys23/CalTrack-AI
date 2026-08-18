import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput } from 'react-native';
import { ChevronLeft, Bell, Smartphone, Watch, Target, Check } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { CalorieRing } from '../../components/CalorieRing';
import { triggerHaptic } from '../../utils/haptics';

// 6.3 Notification Settings Screen
export const NotificationSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, showToast } = useApp();
  const [enabled, setEnabled] = useState(true);
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('12:30');
  const [dinner, setDinner] = useState('19:00');
  const [streak, setStreak] = useState('21:00');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Cài đặt thông báo</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, gap: 14 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Bật thông báo nhắc nhở</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Nhận thông báo ghi bữa ăn</Text>
          </View>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>

        <View style={{ height: 1, backgroundColor: theme.border }} />

        <View style={styles.timeRow}>
          <Text style={{ fontSize: 14, color: theme.text }}>Nhắc bữa sáng</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>{breakfast}</Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={{ fontSize: 14, color: theme.text }}>Nhắc bữa trưa</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>{lunch}</Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={{ fontSize: 14, color: theme.text }}>Nhắc bữa tối</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>{dinner}</Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={{ fontSize: 14, color: theme.text }}>Nhắc giữ streak (Tối)</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.streak }}>{streak}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          triggerHaptic('success');
          showToast('Đã lưu lịch nhắc nhở!');
          onBack();
        }}
        style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 20 }]}
      >
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Lưu cài đặt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 6.4 & 6.5 Widgets & Apple Watch Screen
export const WidgetsAndWatchScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme } = useApp();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Widgets & Apple Watch</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* iOS Small Widget */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginBottom: 8 }}>iOS Small Widget (158 × 158)</Text>
      <View style={[styles.widgetSmall, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <CalorieRing size={90} target={1847} consumed={780} showSubText={false} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 6 }}>1,067 kcal còn lại</Text>
      </View>

      {/* iOS Medium Widget */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginTop: 16, marginBottom: 8 }}>iOS Medium Widget (338 × 158)</Text>
      <View style={[styles.widgetMedium, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <CalorieRing size={90} target={1847} consumed={780} />
        <View style={{ gap: 4 }}>
          <Text style={{ color: theme.protein, fontSize: 12, fontWeight: '700' }}>🥩 68g Protein (còn 70g)</Text>
          <Text style={{ color: theme.carbs, fontSize: 12, fontWeight: '700' }}>🍚 110g Carbs (còn 75g)</Text>
          <Text style={{ color: theme.fat, fontSize: 12, fontWeight: '700' }}>🥑 24g Fat (còn 27g)</Text>
        </View>
      </View>

      {/* Apple Watch */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginTop: 16, marginBottom: 8 }}>Màn hình Apple Watch Series 9</Text>
      <View style={styles.watchFrame}>
        <Text style={{ color: '#aaa', fontSize: 10, fontWeight: '700' }}>09:41 • CALTRACK</Text>
        <CalorieRing size={90} target={1847} consumed={780} />
        <View style={{ backgroundColor: '#FF6B35', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>+ Ghi nhanh</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// 1.19 Edit Goals Screen
export const EditGoalsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, userGoals, setUserGoals, showToast } = useApp();
  const [calories, setCalories] = useState(String(userGoals.targetCalories));
  const [protein, setProtein] = useState(String(userGoals.targetProtein));
  const [carbs, setCarbs] = useState(String(userGoals.targetCarbs));
  const [fat, setFat] = useState(String(userGoals.targetFat));

  const handleSave = () => {
    triggerHaptic('success');
    setUserGoals((prev) => ({
      ...prev,
      targetCalories: parseInt(calories) || 1847,
      targetProtein: parseInt(protein) || 138,
      targetCarbs: parseInt(carbs) || 185,
      targetFat: parseInt(fat) || 51
    }));
    showToast('Đã lưu mục tiêu Calo & Macro mới!');
    onBack();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Chỉnh mục tiêu Calo & Macro</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, gap: 12 }]}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary }}>Calo mục tiêu hằng ngày (kcal)</Text>
        <TextInput keyboardType="numeric" value={calories} onChangeText={setCalories} style={[styles.bigInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} />

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

      <TouchableOpacity onPress={handleSave} style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 20 }]}>
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Lưu thay đổi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '800' },
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnPrimary: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  widgetSmall: { width: 158, height: 158, borderRadius: 24, borderWidth: 1, padding: 14, alignItems: 'center', justifyContent: 'center' },
  widgetMedium: { width: '100%', height: 140, borderRadius: 24, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  watchFrame: { width: 170, height: 210, borderRadius: 40, backgroundColor: '#000', borderWidth: 4, borderColor: '#333', padding: 14, alignItems: 'center', justifyContent: 'space-between' },
  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, fontSize: 16, fontWeight: '700' },
  bigInput: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 22, fontWeight: '900' }
});
