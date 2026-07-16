/**
 * Zaokruživanje nutritivnih prikaza (§16): kcal na cijeli broj, makroi na 1 decimalu.
 * Čista logika — testirano Vitestom.
 */
export function roundKcal(value: number): number {
  return Math.round(value);
}

export function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}
