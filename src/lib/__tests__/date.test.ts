import { describe, expect, it } from 'vitest';

import { addDays, getLocalDateString, getYesterday, isValidDateString, parseLocalDate } from '@/lib/date';

describe('getLocalDateString', () => {
  it('uses LOCAL date components (no UTC bug) at 00:30', () => {
    // Kasnovečernji/rani unos ne smije skliznuti u drugi dan (§17).
    expect(getLocalDateString(new Date(2026, 0, 15, 0, 30, 0))).toBe('2026-01-15');
  });

  it('handles 23:59 without rolling over', () => {
    expect(getLocalDateString(new Date(2026, 11, 31, 23, 59, 0))).toBe('2026-12-31');
  });

  it('zero-pads month and day', () => {
    expect(getLocalDateString(new Date(2026, 2, 5, 12, 0, 0))).toBe('2026-03-05');
  });
});

describe('addDays / getYesterday', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28'); // 2026 nije prijestupna
  });

  it('getYesterday', () => {
    expect(getYesterday('2026-07-16')).toBe('2026-07-15');
  });
});

describe('parseLocalDate', () => {
  it('parses to local components at noon', () => {
    const d = parseLocalDate('2026-07-16');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(16);
  });
});

describe('isValidDateString', () => {
  it('accepts valid dates', () => {
    expect(isValidDateString('2026-07-16')).toBe(true);
  });
  it('rejects malformed or impossible dates', () => {
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-7-16')).toBe(false);
    expect(isValidDateString('nonsense')).toBe(false);
  });
});
