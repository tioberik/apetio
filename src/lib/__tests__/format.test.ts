import { describe, expect, it } from 'vitest';

import { roundKcal, roundMacro } from '@/lib/format';

describe('roundKcal', () => {
  it('rounds to a whole number', () => {
    expect(roundKcal(123.4)).toBe(123);
    expect(roundKcal(123.6)).toBe(124);
  });
});

describe('roundMacro', () => {
  it('rounds to one decimal', () => {
    expect(roundMacro(12.34)).toBe(12.3);
    expect(roundMacro(12.35)).toBe(12.4);
    expect(roundMacro(9)).toBe(9);
  });
});
