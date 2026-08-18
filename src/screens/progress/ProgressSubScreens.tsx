import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import { ChevronLeft, Plus, Ruler, Share2, Sparkles, Trophy, Calendar, Check, ArrowRight } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { RulerPicker } from '../../components/RulerPicker';
import { triggerHaptic } from '../../utils/haptics';

// 4.2 Weight Log Sheet
export const WeightLogSheet: React.FC<{ onSave: (w: number) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const { theme, userProfile } = useApp();
  const [weight, setWeight] = useState(userProfile.currentWeightKg || 65.4);

  return (
    <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Ghi nhận Cân nặng</Text>
        <TouchableOpacity onPress={onClose}><Text style={{ color: theme.textSecondary }}>Đóng</Text></TouchableOpacity>
      </View>
      <RulerPicker min={40} max={150} value={weight} onChange={setWeight} unit="kg" />
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('success');
          onSave(weight);
          onClose();
        }}
        style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 16 }]}
      >
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Lưu cân nặng {weight} kg</Text>
      </TouchableOpacity>
    </View>
  );
};

// 4.4 Body Measurements Log Sheet
export const MeasurementLogSheet: React.FC<{ onSave: () => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const { theme, showToast } = useApp();
  const [waist, setWaist] = useState(68);
  const [hips, setHips] = useState(94);
  const [chest, setChest] = useState(86);
  const [arms, setArms] = useState(26);
  const [bodyFat, setBodyFat] = useState(22.4);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Số đo cơ thể (Body Stats)</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, gap: 12 }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Vòng eo (Waist): {waist} cm</Text>
        <RulerPicker min={50} max={120} value={waist} onChange={setWaist} unit="cm" />

        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 10 }}>Vòng hông (Hips): {hips} cm</Text>
        <RulerPicker min={60} max={140} value={hips} onChange={setHips} unit="cm" />

        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 10 }}>Tỷ lệ mỡ (Body Fat %): {bodyFat}%</Text>
        <RulerPicker min={5} max={50} value={bodyFat} onChange={setBodyFat} unit="%" />
      </View>

      <TouchableOpacity
        onPress={() => {
          triggerHaptic('success');
          showToast('Đã lưu số đo cơ thể mới!');
          onClose();
        }}
        style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 20 }]}
      >
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Lưu số đo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// 4.3 Photo Compare Screen (Before / After Split Slider)
export const PhotoCompareScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, showToast } = useApp();
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>So sánh Trước & Sau</Text>
        <TouchableOpacity onPress={() => showToast('Đã tạo ảnh Story chia sẻ!')} style={styles.iconBtn}>
          <Share2 size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.compareBox, { borderColor: theme.border }]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80' }}
          style={styles.fullImage}
        />
        <View style={[styles.overlayClip, { width: `${splitPos}%` }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80' }}
            style={[styles.fullImage, { width: 340 }]}
          />
        </View>

        {/* Labels */}
        <View style={styles.labelBefore}><Text style={styles.labelTxt}>TRƯỚC (67.5kg)</Text></View>
        <View style={styles.labelAfter}><Text style={styles.labelTxt}>HIỆN TẠI (65.4kg)</Text></View>
      </View>

      {/* Slider Controls */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 16 }]}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 8 }}>
          Kéo để so sánh góc nhìn: {splitPos}%
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
          {[25, 50, 75].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => {
                triggerHaptic('tick');
                setSplitPos(p);
              }}
              style={[styles.btnSmall, { backgroundColor: splitPos === p ? theme.accent : theme.surfaceAlt }]}
            >
              <Text style={{ color: splitPos === p ? theme.accentFg : theme.text, fontWeight: '700', fontSize: 13 }}>{p}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// 4.5 Weekly Report Screen (Story format)
export const WeeklyReportScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, showToast } = useApp();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Báo cáo tuần (Weekly Story)</Text>
        <TouchableOpacity onPress={() => showToast('Đã lưu ảnh báo cáo!')} style={styles.iconBtn}>
          <Share2 size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.storyCard, { backgroundColor: '#141414', borderColor: '#FF6B35' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy size={28} color="#FF6B35" />
          <View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Tuần xuất sắc!</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>11/08 - 18/08/2026</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: '#333', marginVertical: 14 }} />

        <View style={{ gap: 10 }}>
          <View style={styles.recapRow}>
            <Text style={{ color: '#ccc', fontSize: 14 }}>🔥 Calo trung bình / ngày</Text>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>1,745 kcal</Text>
          </View>

          <View style={styles.recapRow}>
            <Text style={{ color: '#ccc', fontSize: 14 }}>🥩 Protein trung bình</Text>
            <Text style={{ color: '#E5484D', fontSize: 16, fontWeight: '800' }}>132g</Text>
          </View>

          <View style={styles.recapRow}>
            <Text style={{ color: '#ccc', fontSize: 14 }}>📉 Cân nặng đã giảm</Text>
            <Text style={{ color: '#22C55E', fontSize: 16, fontWeight: '800' }}>−0.8 kg</Text>
          </View>

          <View style={styles.recapRow}>
            <Text style={{ color: '#ccc', fontSize: 14 }}>🏆 Bữa ăn chất lượng nhất</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Salad Cá Hồi</Text>
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
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  sheetContainer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  btnPrimary: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  compareBox: { width: '100%', height: 380, borderRadius: 24, borderWidth: 2, overflow: 'hidden', position: 'relative' },
  fullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlayClip: { position: 'absolute', top: 0, left: 0, height: '100%', overflow: 'hidden' },
  labelBefore: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  labelAfter: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  labelTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  btnSmall: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  storyCard: { padding: 24, borderRadius: 24, borderWidth: 2 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
