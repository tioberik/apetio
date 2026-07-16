import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export default function AddModal() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>{t('add.title')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: colors.primaryText, fontWeight: '600' }}>{t('common.ok')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
