// Generira drizzle-kit (JS bez tipova) — deklaracija da tsc razriješi import.
declare module '@/db/migrations/migrations' {
  const migrations: {
    journal: { entries: { idx: number; when: number; tag: string; breakpoints: boolean }[] };
    migrations: Record<string, string>;
  };
  export default migrations;
}
