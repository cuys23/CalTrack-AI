import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface RulerPickerProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
}

export const RulerPicker: React.FC<RulerPickerProps> = ({
  min,
  max,
  step = 0.1,
  value,
  onChange,
  unit = 'kg'
}) => {
  const { theme } = useApp();

  const handleStep = (delta: number) => {
    triggerHaptic('tick');
    const next = +(value + delta).toFixed(1);
    if (next >= min && next <= max) {
      onChange(next);
    }
  };

  return (
    <View style={{ alignItems: 'center', width: '100%', marginVertical: 10 }}>
      {/* Big Number */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
        <Text style={{ fontSize: 44, fontWeight: '900', color: theme.text, letterSpacing: -1 }}>
          {value.toFixed(1)}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textSecondary }}>
          {unit}
        </Text>
      </View>

      {/* Stepper Buttons and Visual Ruler */}
      <View style={[styles.rulerContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => handleStep(-1.0)}
          style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>−1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleStep(-0.1)}
          style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>−0.1</Text>
        </TouchableOpacity>

        {/* Center Pointer */}
        <View style={{ alignItems: 'center', marginHorizontal: 16 }}>
          <View style={{ width: 3, height: 32, backgroundColor: theme.accent, borderRadius: 2 }} />
        </View>

        <TouchableOpacity
          onPress={() => handleStep(0.1)}
          style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>+0.1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleStep(1.0)}
          style={[styles.stepBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>+1</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const HealthScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const { theme } = useApp();
  const normalized = Math.min(10, Math.max(1, score));
  const percent = ((normalized - 1) / 9) * 100;

  return (
    <View style={[styles.gaugeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Chỉ số Healthy AI</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>{normalized.toFixed(1)}/10</Text>
          <View style={{ backgroundColor: `${theme.success}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.success }}>
              {normalized >= 8 ? 'Rất tốt' : normalized >= 6 ? 'Khá tốt' : 'Bình thường'}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Track */}
      <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.border, overflow: 'hidden' }}>
        <View style={{ width: `${percent}%`, height: '100%', backgroundColor: theme.success, borderRadius: 4 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rulerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 3
  },
  gaugeBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1
  }
});
