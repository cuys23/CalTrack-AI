import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';

export interface CalorieRingProps {
  size?: number;
  strokeWidth?: number;
  target: number;
  consumed: number;
  burned?: number;
  showSubText?: boolean;
}

export const CalorieRing: React.FC<CalorieRingProps> = ({
  size = 140,
  strokeWidth = 10,
  target,
  consumed,
  burned = 0,
  showSubText = true
}) => {
  const { theme } = useApp();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const netCalories = consumed - burned;
  const remaining = target - netCalories;
  const isOver = remaining < 0;

  const progress = Math.min(1.5, Math.max(0, consumed / (target + burned || 1)));
  const strokeDashoffset = circumference - Math.min(1, progress) * circumference;

  const ringColor = isOver ? theme.danger : theme.calories;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size > 100 ? 32 : 18, fontWeight: '800', color: isOver ? theme.danger : theme.text }}>
            {isOver ? `-${Math.abs(remaining)}` : Math.abs(remaining).toLocaleString()}
          </Text>
          {showSubText && (
            <Text style={{ fontSize: 10, fontWeight: '700', color: isOver ? theme.danger : theme.textSecondary, textTransform: 'uppercase', marginTop: 2 }}>
              {isOver ? 'vượt calo' : 'còn lại'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

interface MacroRingProps {
  type: 'protein' | 'carbs' | 'fat';
  target: number;
  consumed: number;
  size?: number;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  type,
  target,
  consumed,
  size = 54
}) => {
  const { theme } = useApp();
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(1, Math.max(0, consumed / (target || 1)));
  const strokeDashoffset = circumference - progress * circumference;

  const colorMap = {
    protein: theme.protein,
    carbs: theme.carbs,
    fat: theme.fat
  };

  const nameMap = {
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat'
  };

  const remaining = Math.max(0, target - consumed);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorMap[type]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <Text style={{ position: 'absolute', fontSize: 13, fontWeight: '800', color: theme.text }}>
          {consumed}g
        </Text>
      </View>

      <Text style={{ fontSize: 12, fontWeight: '700', color: colorMap[type], marginTop: 4 }}>
        {nameMap[type]}
      </Text>
      <Text style={{ fontSize: 10, color: theme.textTertiary }}>
        còn {remaining}g
      </Text>
    </View>
  );
};
