/**
 * Lokalni datumi (§16, §17). NIKAD `toISOString().slice(0,10)` — to je UTC i upisuje
 * kasnovečernje unose u krivi dan. Sve ovdje koristi LOKALNE komponente datuma.
 */

/** Lokalni 'YYYY-MM-DD' za dani (ili trenutni) Date. */
export function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parsira 'YYYY-MM-DD' u lokalni Date (podne, da ljetno/zimsko vrijeme ne pomakne dan). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Pomak od N dana (može biti negativan) nad 'YYYY-MM-DD', ostaje lokalno. */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/** Jučerašnji lokalni datum. */
export function getYesterday(today: string = getLocalDateString()): string {
  return addDays(today, -1);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Je li string valjan lokalni 'YYYY-MM-DD' (i realan datum). */
export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
