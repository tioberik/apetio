import { describe, expect, it } from 'vitest';

import * as diaryRepo from '@/db/repositories/diary';
import * as foodsRepo from '@/db/repositories/foods';
import { type NewDiaryEntry, type NewFood } from '@/db/schema';

import { createTestDb } from './test-db';

const food: NewFood = {
  id: 'f1',
  name: 'Riža',
  unit: 'g',
  baseAmount: 100,
  kcal: 130,
  protein: 3,
  fat: 1,
  carbs: 28,
  useCount: 1,
  createdAt: '2026-07-16T10:00:00.000Z',
};

const entry: NewDiaryEntry = {
  id: 'e1',
  date: '2026-07-16',
  meal: 'rucak',
  name: 'Riža',
  unit: 'g',
  amount: 100,
  kcal: 130,
  protein: 3,
  fat: 1,
  carbs: 28,
  createdAt: '2026-07-16T10:00:00.000Z',
};

describe('snapshot semantics (§17)', () => {
  it('editing or deleting a food does NOT change existing diary entries', () => {
    const db = createTestDb();
    foodsRepo.insertFood(db, food);
    diaryRepo.insertEntry(db, entry); // snapshot kopija vrijednosti

    foodsRepo.updateFood(db, 'f1', { name: 'Basmati', kcal: 999, protein: 50 });
    const afterEdit = diaryRepo.getEntry(db, 'e1');
    expect(afterEdit?.name).toBe('Riža');
    expect(afterEdit?.kcal).toBe(130);
    expect(afterEdit?.protein).toBe(3);

    foodsRepo.deleteFood(db, 'f1');
    const afterDelete = diaryRepo.getEntry(db, 'e1');
    expect(afterDelete?.kcal).toBe(130);
  });
});
