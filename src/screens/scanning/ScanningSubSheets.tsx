import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Mic, Check, Sparkles, Plus, Minus, Volume2 } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { FoodItem } from '../../types';
import { AiFoodEngine } from '../../services/aiFoodEngine';
import { triggerHaptic } from '../../utils/haptics';

// 2.7 Voice Log Sheet (Waveform & Speech)
export const VoiceLogSheet: React.FC<{ onResult: (food: FoodItem) => void; onClose: () => void }> = ({ onResult, onClose }) => {
  const { theme } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleToggleRecord = async () => {
    triggerHaptic('heavy');
    if (!isRecording) {
      setIsRecording(true);
      setTranscript('Đang lắng nghe: "1 bát bún bò Huế và 1 ly trà đá..."');
      setTimeout(async () => {
        setIsRecording(false);
        const food = await AiFoodEngine.parseNaturalLanguageText('Bún bò Huế');
        onResult(food);
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 6 }}>
        Ghi nhận bằng giọng nói
      </Text>
      <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }}>
        Nói món ăn bạn vừa dùng (VD: "Sáng nay ăn 1 bát phở bò tái ít bánh")
      </Text>

      {/* Mic Button & Waveform Animation */}
      <View style={{ alignItems: 'center', marginVertical: 14 }}>
        <TouchableOpacity
          onPress={handleToggleRecord}
          style={[styles.micCircle, { backgroundColor: isRecording ? theme.danger : theme.accent }]}
        >
          <Mic size={32} color={theme.accentFg} />
        </TouchableOpacity>

        <Text style={{ color: isRecording ? theme.danger : theme.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 14 }}>
          {isRecording ? 'Đang ghi âm... Chạm để dừng' : 'Chạm vào mic để bắt đầu nói'}
        </Text>
      </View>

      {transcript !== '' && (
        <View style={[styles.transcriptBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontSize: 14, fontStyle: 'italic' }}>{transcript}</Text>
        </View>
      )}
    </View>
  );
};

// 2.5 Fix Result Sheet ("AI đoán chưa đúng?")
export const FixResultSheet: React.FC<{
  foodItem: FoodItem;
  onRefine: (refined: FoodItem) => void;
  onClose: () => void;
}> = ({ foodItem, onRefine, onClose }) => {
  const { theme } = useApp();
  const [feedback, setFeedback] = useState('');

  const handleApply = () => {
    if (!feedback.trim()) return;
    triggerHaptic('success');
    const refined = AiFoodEngine.refineFoodItem(foodItem, feedback);
    onRefine(refined);
    onClose();
  };

  return (
    <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 }}>Sửa kết quả AI</Text>
      <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 14 }}>
        Góp ý để AI tính toán lại dinh dưỡng chính xác nhất.
      </Text>

      {/* Quick Suggestions */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {['Ít dầu mỡ hơn', 'Khẩu phần lớn hơn', 'Không ăn kèm cơm', 'Nhiều rau hơn'].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setFeedback(s)}
            style={[styles.suggestionChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={feedback}
        onChangeText={setFeedback}
        placeholder="VD: Chỉ ăn 1 nửa phần sườn..."
        placeholderTextColor={theme.textTertiary}
        style={[styles.textInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
      />

      <TouchableOpacity onPress={handleApply} style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 14 }]}>
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Cập nhật lại dinh dưỡng</Text>
      </TouchableOpacity>
    </View>
  );
};

// 2.13 Quick Add Sheet
export const QuickAddSheet: React.FC<{ onSave: (food: FoodItem) => void; onClose: () => void }> = ({ onSave, onClose }) => {
  const { theme } = useApp();
  const [calories, setCalories] = useState('250');
  const [protein, setProtein] = useState('15');
  const [carbs, setCarbs] = useState('30');
  const [fat, setFat] = useState('8');

  const handleSave = () => {
    triggerHaptic('success');
    const item: FoodItem = {
      id: 'quick-' + Date.now(),
      name: 'Ghi nhanh Calo',
      mealType: 'snack',
      time: '15:00',
      date: new Date().toISOString().split('T')[0],
      calories: parseInt(calories) || 200,
      portion: 1,
      portionUnit: 'phần',
      macros: {
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0
      },
      healthScore: 7.0,
      confidence: 'high',
      source: 'user_edited',
      fkbSourceLabel: 'Nhập nhanh thủ công'
    };
    onSave(item);
    onClose();
  };

  return (
    <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 14 }}>Ghi nhanh Calo & Macros</Text>

      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>Calo (kcal)</Text>
      <TextInput
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
        style={[styles.numberInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.protein }}>Protein (g)</Text>
          <TextInput
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
            style={[styles.smallInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.carbs }}>Carbs (g)</Text>
          <TextInput
            keyboardType="numeric"
            value={carbs}
            onChangeText={setCarbs}
            style={[styles.smallInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.fat }}>Fat (g)</Text>
          <TextInput
            keyboardType="numeric"
            value={fat}
            onChangeText={setFat}
            style={[styles.smallInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
          />
        </View>
      </View>

      <TouchableOpacity onPress={handleSave} style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 10 }]}>
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Lưu vào nhật ký</Text>
      </TouchableOpacity>
    </View>
  );
};

// 5.2 Add Exercise Sheet
export const AddExerciseSheet: React.FC<{
  onAdd: (ex: { title: string; durationMinutes: number; caloriesBurned: number; type: any }) => void;
  onClose: () => void;
}> = ({ onAdd, onClose }) => {
  const { theme } = useApp();
  const [tab, setTab] = useState<'cardio' | 'strength' | 'ai'>('cardio');
  const [type, setType] = useState('Chạy bộ');
  const [duration, setDuration] = useState(30);

  const estimatedBurn = tab === 'cardio' ? duration * 10 : duration * 7;

  const handleSave = () => {
    triggerHaptic('success');
    onAdd({
      title: `${type} (${duration} phút)`,
      durationMinutes: duration,
      caloriesBurned: estimatedBurn,
      type: tab === 'strength' ? 'strength' : 'cardio'
    });
    onClose();
  };

  return (
    <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 12 }}>Thêm bài tập vận động</Text>

      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
        {(['cardio', 'strength', 'ai'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabChip, tab === t && { backgroundColor: theme.accent }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t ? theme.accentFg : theme.textSecondary }}>
              {t === 'cardio' ? 'Cardio' : t === 'strength' ? 'Tập tạ' : 'Mô tả AI'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary }}>Thời lượng: {duration} phút</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
        {[15, 30, 45, 60].map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setDuration(m)}
            style={[styles.btnSmall, { backgroundColor: duration === m ? theme.accent : theme.surfaceAlt }]}
          >
            <Text style={{ color: duration === m ? theme.accentFg : theme.text, fontWeight: '700' }}>{m}p</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, marginVertical: 10 }]}>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Ước tính calo đốt:</Text>
        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.success, marginTop: 2 }}>+{estimatedBurn} kcal</Text>
      </View>

      <TouchableOpacity onPress={handleSave} style={[styles.btnPrimary, { backgroundColor: theme.accent }]}>
        <Text style={{ color: theme.accentFg, fontWeight: '800' }}>Thêm bài tập</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  micCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  transcriptBox: { padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  suggestionChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  textInput: { height: 60, borderRadius: 12, borderWidth: 1, padding: 10, fontSize: 14 },
  numberInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 20, fontWeight: '800' },
  smallInput: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, fontSize: 16, fontWeight: '700' },
  tabChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  btnSmall: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1 },
  btnPrimary: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
});
