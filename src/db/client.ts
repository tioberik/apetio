import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

/**
 * Local-first SQLite klijent (A3). Ekrani NIKAD ne diraju SQL direktno — sve kroz
 * repozitorije (§4). Migracije se pokreću u root layoutu (`useDbMigrations`).
 */
export const sqlite = openDatabaseSync('apetio.db');

// ON DELETE CASCADE (recipe_items → recipes, §5) radi samo uz uključene strane ključeve.
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite);
