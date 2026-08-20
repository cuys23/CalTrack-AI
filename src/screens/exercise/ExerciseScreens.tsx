import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { ChevronLeft, Plus, Footprints, Flame, Heart, Dumbbell, Activity, Check, Sparkles } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  isHealthAvailable,
  requestHealthAccess,
  fetchTodaySummary,
  type HealthSummary,
} from '../../services/healthKit';

// 5.1 Exercise Log Screen
export const ExerciseLogScreen: React.FC<{ onBack: () => void; onOpenAdd: () => void; onOpenSettings: () => void }> = ({
  onBack,
  onOpenAdd,
  onOpenSettings
}) => {
  const { theme, exercises } = useApp();
  const totalBurned = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Vận động & Đốt Calo</Text>
        <TouchableOpacity onPress={onOpenSettings} style={styles.iconBtn}>
          <Heart size={20} color={theme.danger} />
        </TouchableOpacity>
      </View>

      {/* Burned Calorie Hero */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Tổng calo tiêu hao hôm nay</Text>
        <Text style={{ fontSize: 44, fontWeight: '900', color: theme.success, marginVertical: 4 }}>+{totalBurned} kcal</Text>
        <Text style={{ fontSize: 12, color: theme.textTertiary }}>Tự động cộng thêm vào ngân sách ăn uống trong ngày</Text>
      </View>

      {/* Workouts List */}
      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>Bài tập & Hoạt động</Text>
          <TouchableOpacity onPress={onOpenAdd}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.accent }}>+ Thêm bài tập</Text>
          </TouchableOpacity>
        </View>

        {(exercises || []).map((ex) => (
          <View key={ex.id} style={[styles.exRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(62, 123, 250, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Footprints size={18} color="#3E7BFA" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{ex.title}</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>{ex.durationMinutes} phút</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.success }}>+{ex.caloriesBurned} kcal</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// 5.3 Health Sync Settings Screen
export const HealthSyncSettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, showToast } = useApp();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [summary, setSummary] = useState<HealthSummary | null>(null);

  useEffect(() => {
    isHealthAvailable().then(setAvailable);
  }, []);

  const loadSummary = async () => {
    setSummary(await fetchTodaySummary());
  };

  const handleConnect = async () => {
    setConnecting(true);
    triggerHaptic('medium');

    const shown = await requestHealthAccess();
    setConnecting(false);

    if (!shown) {
      showToast('Không mở được quyền truy cập Sức khoẻ.', 'error');
      return;
    }

    // iOS never discloses whether read access was granted, so the honest move
    // is to read once and show whatever actually came back rather than claim a
    // connection succeeded.
    await loadSummary();
    triggerHaptic('success');
  };

  const renderBody = () => {
    if (available === null) {
      return <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Đang kiểm tra...</Text>;
    }

    if (!available) {
      return (
        <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>
          Thiết bị này không có ứng dụng Sức khoẻ, nên không thể đồng bộ.
        </Text>
      );
    }

    return (
      <>
        <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19 }}>
          CalorieIQ đọc số bước chân và calo tiêu hao trong ngày để tính chính xác lượng calo bạn
          còn lại, và ghi cân nặng bạn nhập vào Sức khoẻ. Dữ liệu sức khoẻ không rời khỏi máy của bạn.
        </Text>

        <TouchableOpacity
          onPress={handleConnect}
          disabled={connecting}
          style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 4 }]}
        >
          <Text style={{ color: theme.accentFg, fontWeight: '800' }}>
            {connecting ? 'Đang mở...' : 'Kết nối Sức khoẻ'}
          </Text>
        </TouchableOpacity>

        {summary && (
          <View style={{ gap: 8, marginTop: 4 }}>
            <View style={{ height: 1, backgroundColor: theme.border }} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Dữ liệu hôm nay</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: theme.text }}>Bước chân</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                {summary.steps.toLocaleString('vi-VN')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: theme.text }}>Calo tiêu hao</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                {summary.activeCalories.toLocaleString('vi-VN')} kcal
              </Text>
            </View>
            {summary.steps === 0 && summary.activeCalories === 0 && (
              <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 18 }}>
                Chưa có dữ liệu. Nếu bạn đã từ chối quyền, hãy bật lại trong Cài đặt → Quyền riêng tư
                → Sức khoẻ → CalorieIQ.
              </Text>
            )}
          </View>
        )}
      </>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Apple Health</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, gap: 14 }]}>
        {renderBody()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 40 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 18, fontWeight: '800' },
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  btnPrimary: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
});
