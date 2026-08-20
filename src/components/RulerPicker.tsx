import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface RulerPickerProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  label?: string;
  majorEvery?: number;
}

const STEP_WIDTH = 12; // pixels between ticks

export const RulerPicker: React.FC<RulerPickerProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = 'kg',
  label,
  majorEvery = 5
}) => {
  const { theme } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);
  const isDecimal = step < 1;
  const totalSteps = Math.round((max - min) / step);

  // Generate tick marks
  const ticks = [];
  for (let i = 0; i <= totalSteps; i++) {
    const v = min + i * step;
    const isMajor = i % majorEvery === 0;
    ticks.push({
      index: i,
      val: v,
      isMajor,
      label: isDecimal ? v.toFixed(0) : String(Math.round(v))
    });
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const stepIndex = Math.round(x / STEP_WIDTH);
    const clampedIndex = Math.max(0, Math.min(totalSteps, stepIndex));
    const nextVal = min + clampedIndex * step;
    const roundedVal = isDecimal ? +nextVal.toFixed(1) : Math.round(nextVal);

    if (roundedVal !== value && roundedVal >= min && roundedVal <= max) {
      triggerHaptic('tick');
      onChange(roundedVal);
    }
  };

  const displayValue = isDecimal ? value.toFixed(1) : String(Math.round(value));

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      ) : null}

      {/* Value Display */}
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color: theme.text }]}>{displayValue}</Text>
        <Text style={[styles.unitText, { color: theme.textSecondary }]}>{unit}</Text>
      </View>

      <Text style={[styles.subHint, { color: theme.textTertiary }]}>Kéo ngang để chọn</Text>

      {/* Ruler Viewport */}
      <View style={styles.rulerViewport}>
        {/* Left and right gradient overlays */}
        <View
          pointerEvents="none"
          style={[styles.edgeFade, styles.leftFade, { backgroundColor: theme.bg }]}
        />
        <View
          pointerEvents="none"
          style={[styles.edgeFade, styles.rightFade, { backgroundColor: theme.bg }]}
        />

        {/* Center Indicator */}
        <View pointerEvents="none" style={styles.centerIndicator} />

        {/* Scrollable Tick Track */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STEP_WIDTH}
          decelerationRate="normal"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{
            paddingHorizontal: '50%',
            alignItems: 'flex-start',
            paddingTop: 6,
            height: 70
          }}
        >
          {ticks.map((t) => (
            <View key={t.index} style={styles.tickSlot}>
              {t.isMajor ? (
                <>
                  <View style={[styles.majorTick, { backgroundColor: theme.textSecondary }]} />
                  <Text style={[styles.tickLabel, { color: theme.textTertiary }]}>
                    {t.label}
                  </Text>
                </>
              ) : (
                <View style={[styles.minorTick, { backgroundColor: theme.border }]} />
              )}
            </View>
          ))}
        </ScrollView>
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
              {normalized >= 8 ? 'Rất tốt' : normalized >= 6 ? 'Tương đối' : 'Cần chú ý'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.gaugeTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.gaugeFill, { width: `${percent}%`, backgroundColor: normalized >= 7 ? theme.success : normalized >= 5 ? theme.warning : theme.danger }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4
  },
  label: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingBottom: 4,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  valueText: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 60
  },
  unitText: {
    fontSize: 17,
    fontWeight: '700'
  },
  subHint: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8
  },
  rulerViewport: {
    position: 'relative',
    width: '100%',
    height: 76,
    overflow: 'hidden'
  },
  edgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 3,
    opacity: 0.85
  },
  leftFade: {
    left: 0
  },
  rightFade: {
    right: 0
  },
  centerIndicator: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 3,
    height: 44,
    marginLeft: -1.5,
    borderRadius: 3,
    backgroundColor: '#FF6B35',
    zIndex: 4
  },
  tickSlot: {
    width: STEP_WIDTH,
    alignItems: 'center'
  },
  majorTick: {
    width: 2,
    height: 32,
    borderRadius: 2
  },
  minorTick: {
    width: 2,
    height: 16,
    borderRadius: 2
  },
  tickLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums']
  },
  gaugeBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden'
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 999
  }
});
