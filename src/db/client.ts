import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

/**
 * Local-first SQLite klijent (A3). Otvara se lijeno na prvi pristup.
 * Shema (§5) i migracije + `{ schema }` dolaze u F1; ekrani NIKAD ne diraju SQL direktno (§4).
 */
export const sqlite = openDatabaseSync('apetio.db');
export const db = drizzle(sqlite);
