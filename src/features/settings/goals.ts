import { kv, useKVString } from '@/lib/kv';

/** Dnevni ciljevi (§5 postavke). Punjenje kroz kalkulator (F7); zasad razumni defaulti. */
export interface Goals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  waterMl: number;
}

const KEY = 'goals';

export const DEFAULT_GOALS: Goals = {
  kcal: 2000,
  protein: 120,
  fat: 65,
  carbs: 220,
  waterMl: 2500,
};

function parse(raw: string | undefined): Goals {
  if (!raw) return DEFAULT_GOALS;
  try {
    return { ...DEFAULT_GOALS, ...(JSON.parse(raw) as Partial<Goals>) };
  } catch {
    return DEFAULT_GOALS;
  }
}

export function getGoals(): Goals {
  return parse(kv.getString(KEY));
}

export function setGoals(goals: Goals): void {
  kv.set(KEY, JSON.stringify(goals));
}

export function useGoals(): Goals {
  return parse(useKVString(KEY));
}
