import * as Haptics from 'expo-haptics';

import { db } from '@/db/client';
import * as diaryRepo from '@/db/repositories/diary';
import * as foodsRepo from '@/db/repositories/foods';
import { type Food, type Meal, type NewDiaryEntry, type NewFood } from '@/db/schema';
import { getLocalDateString, getYesterday } from '@/lib/date';
import { newId } from '@/lib/id';
import { scaleMacros } from '@/lib/scale';
import type { Unit } from '@/lib/validation/nutrition';

export interface EntryDraft {
  name: string;
  unit: Unit;
  amount: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  source?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function hapticOk(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Namirnica iz baze → obrok: SNAPSHOT skaliranih vrijednosti + bump use_count/last_used. */
export function addFoodToDiary(food: Food, amount: number, date: string, meal: Meal): void {
  const scaled = scaleMacros(food, food.baseAmount, amount);
  const entry: NewDiaryEntry = {
    id: newId(),
    date,
    meal,
    name: food.name,
    unit: food.unit,
    amount,
    kcal: scaled.kcal,
    protein: scaled.protein,
    fat: scaled.fat,
    carbs: scaled.carbs,
    source: food.source,
    createdAt: nowIso(),
  };
  diaryRepo.insertEntry(db, entry);
  foodsRepo.bumpFoodUsage(db, food.id, getLocalDateString());
  hapticOk();
}

/** Ručni unos; kvačica "spremi u bazu" = quick add u `foods`. */
export function addManualEntry(
  draft: EntryDraft,
  date: string,
  meal: Meal,
  saveToBase: boolean,
): void {
  if (saveToBase) {
    foodsRepo.insertFood(db, {
      id: newId(),
      name: draft.name,
      unit: draft.unit,
      baseAmount: draft.amount,
      kcal: draft.kcal,
      protein: draft.protein,
      fat: draft.fat,
      carbs: draft.carbs,
      source: 'rucno',
      createdAt: nowIso(),
    } satisfies NewFood);
  }
  diaryRepo.insertEntry(db, {
    id: newId(),
    date,
    meal,
    name: draft.name,
    unit: draft.unit,
    amount: draft.amount,
    kcal: draft.kcal,
    protein: draft.protein,
    fat: draft.fat,
    carbs: draft.carbs,
    source: draft.source ?? 'rucno',
    createdAt: nowIso(),
  } satisfies NewDiaryEntry);
  hapticOk();
}

/** "Ponovi jučer" — kopije jučerašnjih unosa za danas u JEDNOJ transakciji (§17). */
export function repeatYesterday(today: string): number {
  const yesterday = diaryRepo.getDayEntries(db, getYesterday(today));
  if (yesterday.length === 0) return 0;
  const copies: NewDiaryEntry[] = yesterday.map((e) => ({
    id: newId(),
    date: today,
    meal: e.meal,
    name: e.name,
    unit: e.unit,
    amount: e.amount,
    kcal: e.kcal,
    protein: e.protein,
    fat: e.fat,
    carbs: e.carbs,
    source: e.source,
    recipeId: e.recipeId,
    createdAt: nowIso(),
  }));
  diaryRepo.insertEntries(db, copies);
  hapticOk();
  return copies.length;
}

export function removeEntry(id: string): void {
  diaryRepo.deleteEntry(db, id);
}

export function updateEntry(id: string, draft: EntryDraft): void {
  diaryRepo.updateEntry(db, id, {
    name: draft.name,
    unit: draft.unit,
    amount: draft.amount,
    kcal: draft.kcal,
    protein: draft.protein,
    fat: draft.fat,
    carbs: draft.carbs,
  });
  hapticOk();
}
