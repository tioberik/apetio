import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/CalorieRing';
import { MacroBars, type MacroBar } from '@/components/MacroBars';
import { type DiaryEntry, MEALS, type Meal } from '@/db/schema';
import { repeatYesterday } from '@/features/diary/actions';
import { useDiaryDay } from '@/features/diary/useDiaryDay';
import { useGoals } from '@/features/settings/goals';
import { getLocalDateString } from '@/lib/date';
import { formatKcal, formatMacro, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme';

function MealSection({
  meal,
  entries,
  date,
  locale,
}: {
  meal: Meal;
  entries: DiaryEntry[];
  date: string;
  locale: string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const kcal = entries.reduce((s, e) => s + e.kcal, 0);

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
          {t(`meals.${meal}`)}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          {formatKcal(kcal, locale)} {t('today.kcalUnit')}
        </Text>
      </View>

      {entries.length === 0 ? (
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('meals.empty')}</Text>
      ) : (
        entries.map((e) => (
          <Pressable
            key={e.id}
            onPress={() => router.push({ pathname: '/uredi/[id]', params: { id: e.id } })}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ color: colors.text, fontSize: 15 }} numberOfLines={1}>
                {e.name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {formatNumber(e.amount, locale, 1)} {e.unit}
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 14 }}>
              {formatKcal(e.kcal, locale)} {t('today.kcalUnit')}
            </Text>
          </Pressable>
        ))
      )}

      <Pressable
        onPress={() => router.push({ pathname: '/dodaj', params: { meal, date } })}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 }}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('meals.add')}</Text>
      </Pressable>
    </View>
  );
}

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const locale = i18n.language;
  const date = getLocalDateString();
  const { byMeal, totals, reload } = useDiaryDay(date);
  const goals = useGoals();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    reload();
    setTimeout(() => setRefreshing(false), 300);
  };

  const remaining = goals.kcal - totals.kcal;
  const bars: MacroBar[] = [
    {
      label: t('macros.protein'),
      text: `${formatMacro(totals.protein, locale)} / ${formatNumber(goals.protein, locale)} g`,
      ratio: goals.protein > 0 ? totals.protein / goals.protein : 0,
      color: colors.primary,
    },
    {
      label: t('macros.carbs'),
      text: `${formatMacro(totals.carbs, locale)} / ${formatNumber(goals.carbs, locale)} g`,
      ratio: goals.carbs > 0 ? totals.carbs / goals.carbs : 0,
      color: colors.sky,
    },
    {
      label: t('macros.fat'),
      text: `${formatMacro(totals.fat, locale)} / ${formatNumber(goals.fat, locale)} g`,
      ratio: goals.fat > 0 ? totals.fat / goals.fat : 0,
      color: colors.amber,
    },
  ];

  const onRepeat = () => {
    const n = repeatYesterday(date);
    if (n === 0) Alert.alert(t('today.repeatYesterday'), t('today.nothingYesterday'));
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ alignItems: 'center', gap: 16 }}>
          <CalorieRing value={totals.kcal} goal={goals.kcal}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 40, fontWeight: '800' }}>
                {formatKcal(totals.kcal, locale)}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                {t('today.goal', { goal: formatKcal(goals.kcal, locale) })} {t('today.kcalUnit')}
              </Text>
              <Text
                style={{
                  color: remaining >= 0 ? colors.primary : colors.amber,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {remaining >= 0
                  ? t('today.remaining', { value: formatKcal(remaining, locale) })
                  : t('today.over', { value: formatKcal(-remaining, locale) })}
              </Text>
            </View>
          </CalorieRing>
          <MacroBars bars={bars} />
        </View>

        <Pressable
          onPress={onRepeat}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="repeat-outline" size={18} color={colors.text} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>{t('today.repeatYesterday')}</Text>
        </Pressable>

        {MEALS.map((meal) => (
          <MealSection key={meal} meal={meal} entries={byMeal[meal]} date={date} locale={locale} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
