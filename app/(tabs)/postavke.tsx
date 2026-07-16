import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppLocale, type ThemeMode, useLocale, useThemeMode } from '@/features/settings/store';
import { useTheme } from '@/theme';

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceAlt,
        borderRadius: 12,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 9,
              alignItems: 'center',
              backgroundColor: active ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                color: active ? colors.primaryText : colors.text,
                fontWeight: active ? '700' : '500',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [mode, setMode] = useThemeMode();
  const [locale, setLocale] = useLocale();

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];
  const localeOptions: { value: AppLocale; label: string }[] = [
    { value: 'hr', label: t('language.hr') },
    { value: 'en', label: t('language.en') },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 28 }}>
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
            {t('settings.language').toUpperCase()}
          </Text>
          <Segmented value={locale} options={localeOptions} onChange={setLocale} />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
            {t('settings.theme').toUpperCase()}
          </Text>
          <Segmented value={mode} options={themeOptions} onChange={setMode} />
        </View>

        <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 8 }}>
          {t('settings.about')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
