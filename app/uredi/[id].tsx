import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/db/client';
import { getEntry } from '@/db/repositories/diary';
import { type Unit } from '@/db/schema';
import { removeEntry, updateEntry } from '@/features/diary/actions';
import { validateNutritionItem } from '@/lib/validation/nutrition';
import { useTheme } from '@/theme';

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}

function Field({
  label,
  value,
  onChangeText,
  numeric,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        style={{
          color: colors.text,
          backgroundColor: colors.surfaceAlt,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
        }}
      />
    </View>
  );
}

export default function EditEntryModal() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = id ? getEntry(db, id) : undefined;

  const [name, setName] = useState(entry?.name ?? '');
  const [unit, setUnit] = useState<Unit>((entry?.unit as Unit) ?? 'g');
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '');
  const [kcal, setKcal] = useState(entry ? String(entry.kcal) : '');
  const [protein, setProtein] = useState(entry ? String(entry.protein) : '');
  const [fat, setFat] = useState(entry ? String(entry.fat) : '');
  const [carbs, setCarbs] = useState(entry ? String(entry.carbs) : '');

  if (!entry || !id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted }}>{t('edit.title')}</Text>
      </SafeAreaView>
    );
  }

  const save = () => {
    const candidate = {
      name: name.trim(),
      unit,
      amount: parseDecimal(amount),
      kcal: parseDecimal(kcal),
      protein: parseDecimal(protein),
      fat: parseDecimal(fat),
      carbs: parseDecimal(carbs),
    };
    const outcome = validateNutritionItem(candidate);
    if (!outcome.valid || !outcome.item) {
      Alert.alert(t('errors.invalid'), outcome.errors.join('\n'));
      return;
    }
    updateEntry(id, outcome.item);
    router.back();
  };

  const confirmDelete = () => {
    Alert.alert(t('edit.deleteConfirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeEntry(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{t('edit.title')}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Field label={t('add.name')} value={name} onChangeText={setName} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label={t('add.amount')} value={amount} onChangeText={setAmount} numeric />
          <View style={{ gap: 6, flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
              {t('add.unit')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['g', 'kom'] as const).map((u) => {
                const active = u === unit;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: active ? colors.primary : colors.surfaceAlt,
                    }}
                  >
                    <Text style={{ color: active ? colors.primaryText : colors.text }}>{u}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
        <Field label={t('add.kcal')} value={kcal} onChangeText={setKcal} numeric />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field label={t('macros.protein')} value={protein} onChangeText={setProtein} numeric />
          <Field label={t('macros.carbs')} value={carbs} onChangeText={setCarbs} numeric />
          <Field label={t('macros.fat')} value={fat} onChangeText={setFat} numeric />
        </View>

        <Pressable
          onPress={save}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16 }}>
            {t('common.save')}
          </Text>
        </Pressable>

        <Pressable
          onPress={confirmDelete}
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.amber} />
          <Text style={{ color: colors.amber, fontWeight: '600' }}>{t('common.delete')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
