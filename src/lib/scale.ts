/**
 * Skaliranje nutritivnih vrijednosti pri promjeni količine (§16 — testirano).
 * Namirnica čuva vrijednosti za `baseAmount`; unos množi po `targetAmount / baseAmount`.
 */
export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export function scaleMacros(base: Macros, baseAmount: number, targetAmount: number): Macros {
  if (baseAmount <= 0) return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  const factor = targetAmount / baseAmount;
  return {
    kcal: base.kcal * factor,
    protein: base.protein * factor,
    fat: base.fat * factor,
    carbs: base.carbs * factor,
  };
}
