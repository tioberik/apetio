import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Dialog } from '@/components/Dialog';
import { db } from '@/db/client';
import { deleteFood, listFoods } from '@/db/repositories/foods';
import { type Food, type Meal, type Unit } from '@/db/schema';
import { addFoodToDiary, addManualEntry } from '@/features/diary/actions';
import { formatKcal } from '@/lib/format';
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
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  numeric?: boolean;
  autoFocus?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
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

export default function AddModal() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const meal = (params.meal ?? 'dorucak') as Meal;
  const date = params.date ?? '';
  const [tab, setTab] = useState<'baza' | 'rucno'>('baza');

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
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
          {t('add.title', { meal: t(`meals.${meal}`) })}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 8 }}>
        {(['baza', 'rucno'] as const).map((tb) => {
          const active = tb === tab;
          return (
            <Pressable
              key={tb}
              onPress={() => setTab(tb)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: active ? colors.primary : colors.surfaceAlt,
              }}
            >
              <Text style={{ color: active ? colors.primaryText : colors.text, fontWeight: '600' }}>
                {t(tb === 'baza' ? 'add.tabBase' : 'add.tabManual')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'baza' ? <BaseTab meal={meal} date={date} /> : <ManualTab meal={meal} date={date} />}
    </SafeAreaView>
  );
}

function BaseTab({ meal, date }: { meal: Meal; date: string }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<Food | null>(null);
  const [amount, setAmount] = useState('');

  const reload = () => setFoods(listFoods(db));
  useEffect(reload, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods;
  }, [foods, search]);

  const confirmAdd = () => {
    if (!pending) return;
    const n = parseDecimal(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    addFoodToDiary(pending, n, date, meal);
    router.back();
  };

  const amountLabel = pending ? `${t('add.amount')} (${pending.unit})` : '';

  const onLongPress = (food: Food) => {
    Alert.alert(food.name, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteFood(db, food.id);
          reload();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('add.search')}
          placeholderTextColor={colors.textMuted}
          style={{
            color: colors.text,
            backgroundColor: colors.surfaceAlt,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>
            {t('add.empty')}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setPending(item);
              setAmount(String(item.baseAmount));
            }}
            onLongPress={() => onLongPress(item)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 15, flex: 1 }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              {formatKcal(item.kcal, i18n.language)} / {item.baseAmount} {item.unit}
            </Text>
          </Pressable>
        )}
      />

      <Dialog visible={pending !== null} onClose={() => setPending(null)}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }} numberOfLines={2}>
          {pending?.name}
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
            {amountLabel}
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            autoFocus
            selectTextOnFocus
            keyboardType="decimal-pad"
            style={{
              color: colors.text,
              backgroundColor: colors.surfaceAlt,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 17,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => setPending(null)}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              backgroundColor: colors.surfaceAlt,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={confirmAdd}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              backgroundColor: colors.primary,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.primaryText, fontWeight: '700' }}>
              {t('add.addButton')}
            </Text>
          </Pressable>
        </View>
      </Dialog>
    </View>
  );
}

function ManualTab({ meal, date }: { meal: Meal; date: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [amount, setAmount] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [saveToBase, setSaveToBase] = useState(true);

  const submit = () => {
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
    addManualEntry(outcome.item, date, meal, saveToBase);
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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
          onPress={() => setSaveToBase((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
        >
          <Ionicons
            name={saveToBase ? 'checkbox' : 'square-outline'}
            size={22}
            color={saveToBase ? colors.primary : colors.textMuted}
          />
          <Text style={{ color: colors.text }}>{t('add.saveToBase')}</Text>
        </Pressable>

        <Pressable
          onPress={submit}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <Text style={{ color: colors.primaryText, fontWeight: '700', fontSize: 16 }}>
            {t('add.addButton')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
