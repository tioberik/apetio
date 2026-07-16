import { describe, expect, it } from 'vitest';

import { isKcalConsistent, validateNutritionItem } from '@/lib/validation/nutrition';

const validItem = {
  name: 'Pileća prsa',
  amount: 150,
  unit: 'g',
  kcal: 165,
  protein: 31,
  fat: 3.6,
  carbs: 0,
};

describe('validateNutritionItem — valid', () => {
  it('accepts a consistent item and returns the normalized value', () => {
    const r = validateNutritionItem(validItem);
    expect(r.valid).toBe(true);
    expect(r.needsReview).toBe(false);
    expect(r.item?.name).toBe('Pileća prsa');
  });

  it('trims the name', () => {
    const r = validateNutritionItem({ ...validItem, name: '  Riža  ' });
    expect(r.item?.name).toBe('Riža');
  });
});

describe('validateNutritionItem — hard errors', () => {
  it('rejects non-object input', () => {
    expect(validateNutritionItem(null).valid).toBe(false);
    expect(validateNutritionItem('x').valid).toBe(false);
  });
  it('rejects amount <= 0', () => {
    expect(validateNutritionItem({ ...validItem, amount: 0 }).valid).toBe(false);
  });
  it('rejects NaN / Infinity', () => {
    expect(validateNutritionItem({ ...validItem, kcal: Number.NaN }).valid).toBe(false);
    expect(validateNutritionItem({ ...validItem, protein: Number.POSITIVE_INFINITY }).valid).toBe(
      false,
    );
  });
  it('rejects out-of-range kcal and macros', () => {
    expect(validateNutritionItem({ ...validItem, kcal: 6000 }).valid).toBe(false);
    expect(validateNutritionItem({ ...validItem, fat: 1500 }).valid).toBe(false);
  });
  it('rejects bad unit', () => {
    expect(validateNutritionItem({ ...validItem, unit: 'ml' }).valid).toBe(false);
  });
  it('rejects empty / too-long / control-char names', () => {
    expect(validateNutritionItem({ ...validItem, name: '' }).valid).toBe(false);
    expect(validateNutritionItem({ ...validItem, name: 'x'.repeat(121) }).valid).toBe(false);
    const withControlChar = `a${String.fromCharCode(1)}b`;
    expect(validateNutritionItem({ ...validItem, name: withControlChar }).valid).toBe(false);
  });
});

describe('kcal consistency (soft flag)', () => {
  it('flags inconsistent kcal but stays valid', () => {
    // makroi impliciraju ~124 kcal, prijavljeno 400 → izvan ±35 %
    const r = validateNutritionItem({ ...validItem, kcal: 400, protein: 31, fat: 0, carbs: 0 });
    expect(r.valid).toBe(true);
    expect(r.needsReview).toBe(true);
  });

  it('isKcalConsistent tolerance', () => {
    expect(isKcalConsistent(124, 31, 0, 0)).toBe(true); // 4*31 = 124
    expect(isKcalConsistent(160, 31, 0, 0)).toBe(true); // +29 % unutar 35 %
    expect(isKcalConsistent(200, 31, 0, 0)).toBe(false); // +61 %
    expect(isKcalConsistent(0, 0, 0, 0)).toBe(true);
  });
});
