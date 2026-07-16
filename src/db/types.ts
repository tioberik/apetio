import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

/**
 * Zajednički tip baze za repozitorije. Aplikacija koristi expo-sqlite (sinkroni driver);
 * testovi ubace better-sqlite3 instancu castom (isti sinkroni query API). Repozitoriji su
 * JEDINI sloj koji dira SQL (§4).
 */
export type AppDatabase = ExpoSQLiteDatabase<Record<string, never>>;
