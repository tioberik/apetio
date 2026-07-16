import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface Props {
  title: string;
  subtitle: string;
}

/** Generičko prazno stanje ekrana za F0. Boje kroz temu (§8/§11), tekst kroz i18n (§10). */
export function ScreenPlaceholder({ title, subtitle }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center' }}>
          {subtitle}
        </Text>
      </View>
    </SafeAreaView>
  );
}
