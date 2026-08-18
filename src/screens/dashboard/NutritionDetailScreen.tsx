import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { ChevronLeft, Sparkles, Mic, Type, Bookmark, Camera, Barcode, FileText, Plus, AlertTriangle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { FoodItem } from '../../types';
import { AiFoodEngine } from '../../services/aiFoodEngine';
import { triggerHaptic } from '../../utils/haptics';

// 3.2 Nutrition Detail Screen
export const NutritionDetailScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, userGoals } = useApp();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const days = [
    { day: 'T2', kcal: 1820 },
    { day: 'T3', kcal: 1950 },
    { day: 'T4', kcal: 1740 },
    { day: 'T5', kcal: 1860 },
    { day: 'T6', kcal: 2100 },
    { day: 'T7', kcal: 1680 },
    { day: 'CN', kcal: 1780 }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Chi tiết Dinh dưỡng & Vi chất</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Period Tabs */}
      <View style={[styles.tabRow, { backgroundColor: theme.surfaceAlt }]}>
        {(['day', 'week', 'month'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => {
              triggerHaptic('light');
              setPeriod(p);
            }}
            style={[styles.periodTab, period === p && { backgroundColor: theme.surface }]}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: period === p ? theme.text : theme.textSecondary }}>
              {p === 'day' ? 'Hôm nay' : p === 'week' ? 'Tuần này' : 'Tháng này'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calorie Bar Chart */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 16 }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 12 }}>
          Lượng Calo theo ngày (Mục tiêu: {userGoals.targetCalories} kcal)
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 20 }}>
          {days.map((d) => {
            const hPercent = Math.min(100, (d.kcal / 2500) * 100);
            const isOver = d.kcal > userGoals.targetCalories;
            return (
              <View key={d.day} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 14, height: `${hPercent}%`, backgroundColor: isOver ? theme.danger : theme.accent, borderRadius: 6 }} />
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 6, fontWeight: '600' }}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 9 Micronutrients Table */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Bảng Vi chất dinh dưỡng</Text>
        {[
          { name: 'Chất xơ (Fiber)', amount: '24.5g', target: '28g', status: 'good' },
          { name: 'Đường (Sugar)', amount: '32g', target: '< 50g', status: 'good' },
          { name: 'Natri (Sodium)', amount: '2,640mg', target: '< 2,300mg', status: 'warning' },
          { name: 'Cholesterol', amount: '185mg', target: '< 300mg', status: 'good' },
          { name: 'Kali (Potassium)', amount: '2,400mg', target: '3,500mg', status: 'normal' },
          { name: 'Canxi (Calcium)', amount: '820mg', target: '1,000mg', status: 'normal' },
          { name: 'Sắt (Iron)', amount: '14.2mg', target: '18mg', status: 'good' },
          { name: 'Vitamin C', amount: '68mg', target: '75mg', status: 'good' },
          { name: 'Vitamin D', amount: '12mcg', target: '15mcg', status: 'normal' }
        ].map((item, idx) => (
          <View key={idx} style={[styles.microRow, { borderBottomColor: theme.border, borderBottomWidth: idx < 8 ? 1 : 0 }]}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{item.name}</Text>
              <Text style={{ fontSize: 11, color: theme.textTertiary }}>Mục tiêu: {item.target}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: item.status === 'warning' ? theme.danger : theme.text }}>
                {item.amount}
              </Text>
              {item.status === 'warning' && <AlertTriangle size={14} color={theme.danger} />}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// 2.1 Log Menu Sheet
export const LogMenuSheet: React.FC<{
  onSelectCamera: (mode: 'food' | 'barcode' | 'label') => void;
  onSelectText: () => void;
  onSelectVoice: () => void;
  onSelectSearch: () => void;
  onSelectSaved: () => void;
  onSelectRecipe: () => void;
  onSelectQuickAdd: () => void;
  onClose: () => void;
}> = ({
  onSelectCamera,
  onSelectText,
  onSelectVoice,
  onSelectSearch,
  onSelectSaved,
  onSelectRecipe,
  onSelectQuickAdd,
  onClose
}) => {
  const { theme, userProfile } = useApp();

  const options = [
    { title: 'Quét món ăn bằng AI', subtitle: 'Chụp ảnh món ăn', icon: Camera, color: '#FF6B35', action: () => onSelectCamera('food') },
    { title: 'Quét mã vạch', subtitle: 'Thực phẩm đóng gói', icon: Barcode, color: '#3E7BFA', action: () => onSelectCamera('barcode') },
    { title: 'Quét bảng dinh dưỡng', subtitle: 'OCR nhãn vi chất', icon: FileText, color: '#22C55E', action: () => onSelectCamera('label') },
    { title: 'Nhập bằng văn bản', subtitle: 'Mô tả món tự nhiên', icon: Type, color: '#F5A524', action: onSelectText },
    { title: 'Nhập giọng nói', subtitle: 'Nói món bạn vừa ăn', icon: Mic, color: '#E5484D', action: onSelectVoice },
    { title: 'Tìm trong thư viện', subtitle: 'Kho món ăn Việt', icon: Sparkles, color: '#8B5CF6', action: onSelectSearch },
    { title: 'Món ăn đã lưu', subtitle: 'Món ăn yêu thích', icon: Bookmark, color: '#EC4899', action: onSelectSaved },
    { title: 'Nhập từ công thức', subtitle: 'Dán link TikTok/Web', icon: Plus, color: '#10B981', action: onSelectRecipe }
  ];

  return (
    <View style={[styles.bottomSheetContainer, { backgroundColor: theme.surface }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Ghi nhận bữa ăn</Text>
        <TouchableOpacity onPress={onClose}><Text style={{ color: theme.textSecondary }}>Đóng</Text></TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              triggerHaptic('light');
              opt.action();
            }}
            style={[styles.menuGridItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: `${opt.color}20` }]}>
              <opt.icon size={20} color={opt.color} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginTop: 6 }} numberOfLines={1}>
              {opt.title}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textTertiary }} numberOfLines={1}>
              {opt.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 2.6 Text Log Sheet
export const TextLogSheet: React.FC<{ onResult: (food: FoodItem) => void; onClose: () => void }> = ({ onResult, onClose }) => {
  const { theme } = useApp();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    triggerHaptic('medium');
    const food = await AiFoodEngine.parseNaturalLanguageText(prompt);
    setLoading(false);
    onResult(food);
  };

  return (
    <View style={[styles.bottomSheetContainer, { backgroundColor: theme.surface }]}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 }}>Nhập bằng văn bản</Text>
      <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 12 }}>
        Nhập tự nhiên món ăn của bạn (VD: "1 đĩa cơm tấm sườn chả và 1 ly cà phê sữa đá").
      </Text>

      <TextInput
        multiline
        numberOfLines={3}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Gõ món ăn tại đây..."
        placeholderTextColor={theme.textTertiary}
        style={[styles.textInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
      />

      <TouchableOpacity
        onPress={handleAnalyze}
        disabled={loading}
        style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 12 }]}
      >
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>
          {loading ? 'AI đang phân tích...' : 'Phân tích món ăn'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '800' },
  tabRow: { flexDirection: 'row', padding: 4, borderRadius: 12, marginBottom: 16 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  microRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  bottomSheetContainer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  menuGridItem: { width: '48%', padding: 12, borderRadius: 16, borderWidth: 1 },
  menuIconCircle: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textInput: { borderRadius: 14, borderWidth: 1, padding: 12, fontSize: 15, textAlignVertical: 'top', height: 80 },
  btnPrimary: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
});
