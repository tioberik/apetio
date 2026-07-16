import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

interface Props {
  value: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}

function CalorieRingBase({ value, goal, size = 210, strokeWidth = 16, children }: Props) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal > 0 ? value / goal : 0;
  const over = ratio > 1;
  const progress = Math.min(Math.max(ratio, 0), 1);
  const color = over ? colors.amber : colors.primary;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export const CalorieRing = memo(CalorieRingBase);
