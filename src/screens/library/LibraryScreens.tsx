import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { ChevronLeft, Search, Plus, Bookmark, Clock, Sparkles, Check, Flame, Shield, Award, Gift, Bell } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { FoodItem } from '../../types';
import { FOOD_DATABASE, FKB_DATABASE, AiFoodEngine } from '../../services/aiFoodEngine';
import { triggerHaptic } from '../../utils/haptics';

// 2.8 Food Search Screen
export const FoodSearchScreen: React.FC<{ onSelectFood: (food: FoodItem) => void; onBack: () => void }> = ({ onSelectFood, onBack }) => {
  const { theme } = useApp();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'vietnamese' | 'my_foods'>('all');

  const filtered = (FKB_DATABASE || FOOD_DATABASE || []).filter((f) => {
    if (!f) return false;
    if (tab === 'vietnamese' && f.category !== 'vietnamese') return false;
    const q = search.toLowerCase();
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.tags && f.tags.some((t) => t.toLowerCase().includes(q))) ||
      (f.aliases && f.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, padding: 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Tìm kiếm món ăn</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Search size={18} color={theme.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm phở, cơm tấm, bún bò..."
          placeholderTextColor={theme.textTertiary}
          style={{ flex: 1, marginLeft: 8, color: theme.text, fontSize: 15 }}
        />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 6, marginVertical: 12 }}>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'vietnamese', label: 'Món Việt 🇻🇳' },
          { id: 'my_foods', label: 'Của tôi' }
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id as any)}
            style={[styles.chip, tab === t.id && { backgroundColor: theme.accent }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.id ? theme.accentFg : theme.textSecondary }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      <ScrollView style={{ flex: 1 }}>
        {filtered.map((item, idx) => {
          const key = item.fkbId || (item as any).id || `food-item-${idx}`;
          const kcal = Math.round((item.per100g?.calories || 100) * ((item.defaultGrams || 100) / 100));
          const unit = item.defaultUnit || (item as any).portionUnit || 'phần';

          return (
            <TouchableOpacity
              key={key}
              onPress={() => {
                triggerHaptic('light');
                onSelectFood(AiFoodEngine.createFoodItemFromFkb(item, item.defaultGrams || 350));
              }}
              style={[styles.foodRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 10 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>1 {unit} ({item.defaultGrams}g) • {kcal} kcal</Text>
              </View>
              <Plus size={18} color={theme.accent} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// 6.1 Streak Detail Screen
export const StreakDetailScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, userProfile } = useApp();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Chuỗi ngày kiên trì (Streak)</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 64 }}>🔥</Text>
        <Text style={{ fontSize: 44, fontWeight: '900', color: theme.streak, marginTop: 4 }}>{userProfile.streakCount}</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>ngày liên tiếp</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>
          Ghi nhận ít nhất 1 bữa ăn mỗi ngày để giữ ngọn lửa không bị tắt!
        </Text>
      </View>

      {/* Streak Freeze Card */}
      <View style={[styles.card, { backgroundColor: 'rgba(62, 123, 250, 0.1)', borderColor: 'rgba(62, 123, 250, 0.3)', marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <Shield size={24} color="#3E7BFA" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Bảo vệ Streak (Freeze)</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>Còn 2 lượt bảo vệ tự động nếu bạn lỡ quên ghi 1 ngày.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// 6.2 Achievements Screen
export const AchievementsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, achievements } = useApp();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Huy hiệu & Thành tích</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(achievements || []).map((ach) => (
          <View key={ach.id} style={[styles.badgeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ fontSize: 32 }}>{ach.icon}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, marginTop: 6, textAlign: 'center' }}>{ach.title}</Text>
            <Text style={{ fontSize: 10, color: theme.success, marginTop: 2 }}>✓ Đã mở khoá</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// 7.2 Referral Screen
export const ReferralScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, userProfile, showToast } = useApp();

  const handleCopy = () => {
    triggerHaptic('success');
    showToast(`Đã sao chép mã ${userProfile.referralCode}!`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, padding: 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Giới thiệu bạn bè</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', padding: 24, marginTop: 10 }]}>
        <Gift size={40} color="#FF6B35" />
        <Text style={[styles.h1, { color: theme.text, textAlign: 'center', marginTop: 12 }]}>Tặng 1 tháng Pro Miễn Phí</Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 14, marginVertical: 8 }}>
          Mỗi khi 1 người bạn đăng ký bằng mã của bạn, cả hai đều nhận được 1 tháng CalTrack AI Pro miễn phí.
        </Text>

        <TouchableOpacity onPress={handleCopy} style={[styles.codeBox, { borderColor: theme.accent }]}>
          <Text style={{ fontSize: 10, color: theme.textTertiary, textTransform: 'uppercase' }}>Chạm để sao chép</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: 3, marginTop: 2 }}>
            {userProfile.referralCode}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: theme.success, fontWeight: '700', fontSize: 13, marginTop: 12 }}>
          🎉 {userProfile.referredCount} người bạn đã dùng mã
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' },
  foodRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  badgeCard: { width: '31%', padding: 12, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
  h1: { fontSize: 22, fontWeight: '900' },
  codeBox: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', marginTop: 14 }
});
