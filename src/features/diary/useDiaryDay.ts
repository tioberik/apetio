import { useFocusEffect } from 'expo-router';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { db } from '@/db/client';
import { getDayEntries } from '@/db/repositories/diary';
import { type DiaryEntry, type Meal } from '@/db/schema';

export interface DayTotals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface DiaryDay {
  entries: DiaryEntry[];
  byMeal: Record<Meal, DiaryEntry[]>;
  totals: DayTotals;
  reload: () => void;
}

function emptyByMeal(): Record<Meal, DiaryEntry[]> {
  return { dorucak: [], rucak: [], vecera: [], uzina: [] };
}

/** Unosi jednog dana — JEDAN upit, podjela po obrocima + totali u memoriji (§17). */
export function useDiaryDay(date: string): DiaryDay {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  const reload = useCallback(() => setEntries(getDayEntries(db, date)), [date]);

  useEffect(() => {
    reload();
    const sub = addDatabaseChangeListener(() => reload());
    return () => sub.remove();
  }, [reload]);

  // Osvježi kad se ekran vrati u fokus (npr. nakon zatvaranja modala Dodaj/Uredi).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const byMeal = useMemo(() => {
    const grouped = emptyByMeal();
    for (const entry of entries) grouped[entry.meal as Meal].push(entry);
    return grouped;
  }, [entries]);

  const totals = useMemo<DayTotals>(
    () =>
      entries.reduce<DayTotals>(
        (acc, e) => ({
          kcal: acc.kcal + e.kcal,
          protein: acc.protein + e.protein,
          fat: acc.fat + e.fat,
          carbs: acc.carbs + e.carbs,
        }),
        { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      ),
    [entries],
  );

  return { entries, byMeal, totals, reload };
}
