import { beforeEach, describe, expect, it } from 'vitest';

import * as diary from '@/db/repositories/diary';
import * as dayMeta from '@/db/repositories/dayMeta';
import * as foods from '@/db/repositories/foods';
import * as recipesRepo from '@/db/repositories/recipes';
import * as supplementsRepo from '@/db/repositories/supplements';
import { seedSupplementsIfEmpty } from '@/db/seed';
import type { AppDatabase } from '@/db/types';
import { type Meal, type NewDiaryEntry, type NewFood } from '@/db/schema';

import { createTestDb } from './test-db';

let db: AppDatabase;
beforeEach(() => {
  db = createTestDb();
});

function makeEntry(o: { date: string; meal: Meal; kcal?: number; id?: string }): NewDiaryEntry {
  return {
    id: o.id ?? `e-${Math.random().toString(36).slice(2)}`,
    date: o.date,
    meal: o.meal,
    name: 'Test',
    unit: 'g',
    amount: 100,
    kcal: o.kcal ?? 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    createdAt: '2026-07-16T10:00:00.000Z',
  };
}

function makeFood(o: { id: string; name: string; useCount: number }): NewFood {
  return {
    id: o.id,
    name: o.name,
    unit: 'g',
    baseAmount: 100,
    kcal: 100,
    protein: 10,
    fat: 5,
    carbs: 5,
    useCount: o.useCount,
    createdAt: '2026-07-16T10:00:00.000Z',
  };
}

describe('diary aggregates', () => {
  it('getDayTotals sums a single day (one query)', () => {
    diary.insertEntry(db, makeEntry({ date: '2026-07-16', meal: 'dorucak', kcal: 100 }));
    diary.insertEntry(db, makeEntry({ date: '2026-07-16', meal: 'rucak', kcal: 250 }));
    diary.insertEntry(db, makeEntry({ date: '2026-07-15', meal: 'rucak', kcal: 999 }));

    expect(diary.getDayTotals(db, '2026-07-16').kcal).toBe(350);
    expect(diary.getDayTotals(db, '2026-07-14').kcal).toBe(0);
  });

  it('getRangeTotals groups by date, ordered', () => {
    diary.insertEntry(db, makeEntry({ date: '2026-07-15', meal: 'dorucak', kcal: 100 }));
    diary.insertEntry(db, makeEntry({ date: '2026-07-16', meal: 'dorucak', kcal: 200 }));
    diary.insertEntry(db, makeEntry({ date: '2026-07-16', meal: 'rucak', kcal: 50 }));

    const rows = diary.getRangeTotals(db, '2026-07-15', '2026-07-16');
    expect(rows).toEqual([
      { date: '2026-07-15', kcal: 100, protein: 0, fat: 0, carbs: 0 },
      { date: '2026-07-16', kcal: 250, protein: 0, fat: 0, carbs: 0 },
    ]);
  });

  it('insertEntries writes all rows in one transaction', () => {
    diary.insertEntries(db, [
      makeEntry({ date: '2026-07-16', meal: 'dorucak', kcal: 100 }),
      makeEntry({ date: '2026-07-16', meal: 'uzina', kcal: 50 }),
    ]);
    expect(diary.getDayEntries(db, '2026-07-16')).toHaveLength(2);
  });

  it('rejects an invalid meal via CHECK constraint', () => {
    expect(() =>
      diary.insertEntry(db, { ...makeEntry({ date: '2026-07-16', meal: 'dorucak' }), meal: 'brunch' as Meal }),
    ).toThrow();
  });
});

describe('foods ordering', () => {
  it('lists by use_count DESC, then name ASC (one query)', () => {
    foods.insertFood(db, makeFood({ id: 'a', name: 'Zobene', useCount: 5 }));
    foods.insertFood(db, makeFood({ id: 'b', name: 'Riža', useCount: 10 }));
    foods.insertFood(db, makeFood({ id: 'c', name: 'Ananas', useCount: 10 }));

    expect(foods.listFoods(db).map((f) => f.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('recipes join totals', () => {
  it('sums items in one JOIN/GROUP BY query and cascades delete', () => {
    recipesRepo.insertRecipeWithItems(
      db,
      { id: 'r1', name: 'Zdjela', portions: 2, createdAt: '2026-07-16T10:00:00.000Z' },
      [
        { id: 'i1', recipeId: 'r1', name: 'Riža', unit: 'g', amount: 100, kcal: 130, protein: 3, fat: 1, carbs: 28 },
        { id: 'i2', recipeId: 'r1', name: 'Piletina', unit: 'g', amount: 150, kcal: 165, protein: 31, fat: 4, carbs: 0 },
      ],
    );

    const [recipe] = recipesRepo.listRecipesWithTotals(db);
    expect(recipe.kcal).toBe(295);
    expect(recipe.itemCount).toBe(2);

    recipesRepo.deleteRecipe(db, 'r1');
    expect(recipesRepo.getRecipeItems(db, 'r1')).toHaveLength(0); // ON DELETE CASCADE
  });
});

describe('day_meta water upsert', () => {
  it('sets and updates water via upsert', () => {
    dayMeta.setWaterMl(db, '2026-07-16', 500);
    expect(dayMeta.getWaterMl(db, '2026-07-16')).toBe(500);
    dayMeta.setWaterMl(db, '2026-07-16', 750);
    expect(dayMeta.getWaterMl(db, '2026-07-16')).toBe(750);
    expect(dayMeta.getWaterMl(db, '2026-07-01')).toBe(0);
  });
});

describe('supplement seed', () => {
  it('seeds owner protocol once, idempotently', () => {
    seedSupplementsIfEmpty(db);
    seedSupplementsIfEmpty(db);
    const list = supplementsRepo.listSupplements(db);
    expect(list.map((s) => s.id)).toEqual(['kreatin', 'magnezij']);
    expect(list[0].doses).toBe(1);
    expect(list[1].doses).toBe(2);
  });

  it('tracks doses per day', () => {
    seedSupplementsIfEmpty(db);
    supplementsRepo.setSupplementTaken(db, '2026-07-16', 'kreatin', 1);
    expect(supplementsRepo.getSupplementTaken(db, '2026-07-16', 'kreatin')).toBe(1);
    supplementsRepo.setSupplementTaken(db, '2026-07-16', 'kreatin', 0);
    expect(supplementsRepo.getSupplementTaken(db, '2026-07-16', 'kreatin')).toBe(0);
  });
});
