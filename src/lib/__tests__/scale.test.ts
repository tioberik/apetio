import { describe, expect, it } from 'vitest';

import { scaleMacros } from '@/lib/scale';

describe('scaleMacros', () => {
  it('scales linearly from base amount to target', () => {
    expect(scaleMacros({ kcal: 100, protein: 10, fat: 5, carbs: 5 }, 100, 150)).toEqual({
      kcal: 150,
      protein: 15,
      fat: 7.5,
      carbs: 7.5,
    });
  });

  it('scales down', () => {
    expect(scaleMacros({ kcal: 200, protein: 20, fat: 10, carbs: 30 }, 200, 100)).toEqual({
      kcal: 100,
      protein: 10,
      fat: 5,
      carbs: 15,
    });
  });

  it('guards against zero base amount', () => {
    expect(scaleMacros({ kcal: 100, protein: 10, fat: 5, carbs: 5 }, 0, 150)).toEqual({
      kcal: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
  });
});
