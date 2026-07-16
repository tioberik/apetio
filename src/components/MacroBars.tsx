import { memo } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface MacroBar {
  label: string;
  text: string;
  ratio: number;
  color: string;
}

function MacroBarsBase({ bars }: { bars: MacroBar[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 12, width: '100%' }}>
      {bars.map((bar) => (
        <View key={bar.label} style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
              {bar.label}
            </Text>
            <Text style={{ color: colors.text, fontSize: 13 }}>{bar.text}</Text>
          </View>
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.surfaceAlt,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: 8,
                width: `${Math.min(Math.max(bar.ratio, 0), 1) * 100}%`,
                backgroundColor: bar.color,
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export const MacroBars = memo(MacroBarsBase);
