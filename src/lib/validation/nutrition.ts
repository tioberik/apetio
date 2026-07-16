/**
 * Validator nepovjerljivih nutritivnih ulaza (§12.4). Koristi se PRIJE upisa u bazu za
 * sva tri nepovjerljiva izvora: AI odgovor, OFF odgovor, uvezena datoteka.
 *
 * Tvrde greške (`valid=false`) → stavku odbaci/preskoči.
 * Meki flag (`needsReview=true`, kcal ≉ 4·B+4·UH+9·M) → vizualno označi, NE odbacuj.
 */

export const NUTRITION_LIMITS = {
  nameMaxLength: 120,
  kcalMax: 5000,
  macroMax: 1000,
  /** kcal ≈ 4·B + 4·UH + 9·M ± 35 % (§12.4) */
  consistencyTolerance: 0.35,
} as const;

export type Unit = 'g' | 'kom';

export interface ValidatedNutrition {
  name: string;
  amount: number;
  unit: Unit;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface ValidationOutcome {
  valid: boolean;
  errors: string[];
  /** kcal nekonzistentan s makroima — označi za ručnu provjeru, ne odbacuj. */
  needsReview: boolean;
  item?: ValidatedNutrition;
}

/** Sadrži li string kontrolne znakove (0x00–0x1F ili 0x7F). Bez regexa radi izvornog koda. */
function hasControlChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function pick(input: unknown, key: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[key]
    : undefined;
}

/** Očekivane kcal iz makroa (Atwater). */
export function expectedKcal(protein: number, carbs: number, fat: number): number {
  return 4 * protein + 4 * carbs + 9 * fat;
}

/** kcal ≈ 4·B + 4·UH + 9·M ± 35 % (§12.4). */
export function isKcalConsistent(
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
): boolean {
  const expected = expectedKcal(protein, carbs, fat);
  if (expected === 0 && kcal === 0) return true;
  const denom = Math.max(expected, 1);
  return Math.abs(kcal - expected) <= NUTRITION_LIMITS.consistencyTolerance * denom;
}

/** Validira jednu stavku kanonskog oblika { name, amount, unit, kcal, protein, fat, carbs }. */
export function validateNutritionItem(input: unknown): ValidationOutcome {
  const errors: string[] = [];

  const rawName = pick(input, 'name');
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (typeof rawName !== 'string' || name.length === 0) {
    errors.push('name: obavezan neprazan string');
  } else if (name.length > NUTRITION_LIMITS.nameMaxLength) {
    errors.push(`name: dulji od ${NUTRITION_LIMITS.nameMaxLength} znakova`);
  } else if (hasControlChars(name)) {
    errors.push('name: sadrži kontrolne znakove');
  }

  const unit = pick(input, 'unit');
  if (unit !== 'g' && unit !== 'kom') {
    errors.push("unit: mora biti 'g' ili 'kom'");
  }

  const amount = pick(input, 'amount');
  if (!isFiniteNumber(amount) || amount <= 0) {
    errors.push('amount: konačan broj > 0');
  }

  const kcal = pick(input, 'kcal');
  if (!isFiniteNumber(kcal) || kcal < 0 || kcal > NUTRITION_LIMITS.kcalMax) {
    errors.push(`kcal: konačan broj 0–${NUTRITION_LIMITS.kcalMax}`);
  }

  const macros: Record<'protein' | 'fat' | 'carbs', number> = { protein: 0, fat: 0, carbs: 0 };
  for (const key of ['protein', 'fat', 'carbs'] as const) {
    const v = pick(input, key);
    if (!isFiniteNumber(v) || v < 0 || v > NUTRITION_LIMITS.macroMax) {
      errors.push(`${key}: konačan broj 0–${NUTRITION_LIMITS.macroMax} g`);
    } else {
      macros[key] = v;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, needsReview: false };
  }

  const item: ValidatedNutrition = {
    name,
    amount: amount as number,
    unit: unit as Unit,
    kcal: kcal as number,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
  };
  const needsReview = !isKcalConsistent(item.kcal, item.protein, item.carbs, item.fat);
  return { valid: true, errors: [], needsReview, item };
}
