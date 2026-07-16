import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { AppDatabase } from '@/db/types';

const MIGRATIONS_DIR = join(process.cwd(), 'src', 'db', 'migrations');

/**
 * In-memory better-sqlite3 baza s primijenjenom PRAVOM generiranom shemom (§F1 test).
 * Isti sinkroni query API kao expo-sqlite → repozitoriji rade nepromijenjeni.
 */
export function createTestDb(): AppDatabase {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  const sqlFiles = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of sqlFiles) {
    const raw = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    for (const statement of raw.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) sqlite.exec(trimmed);
    }
  }

  return drizzle(sqlite) as unknown as AppDatabase;
}
