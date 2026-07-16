/**
 * Zaokruživanje i lokalizirani prikaz nutritivnih vrijednosti (§16): kcal na cijeli broj,
 * makroi na 1 decimalu, decimalni zarez u hr localeu (§9) kroz Intl.
 */
export function roundKcal(value: number): number {
  return Math.round(value);
}

export function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Lokalizirani broj (hr: "1,5"). */
export function formatNumber(value: number, locale: string, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(value);
}

/** kcal — cijeli broj, lokalizirano. */
export function formatKcal(value: number, locale: string): string {
  return formatNumber(roundKcal(value), locale, 0);
}

/** Makro — 1 decimala, lokalizirano (npr. "3,6"). */
export function formatMacro(value: number, locale: string): string {
  return formatNumber(roundMacro(value), locale, 1);
}

/** Voda u litrama iz ml (npr. 2500 → "2,5"). */
export function formatLiters(ml: number, locale: string): string {
  return formatNumber(ml / 1000, locale, 2);
}
