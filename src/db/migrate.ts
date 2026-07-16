import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from '@/db/client';

import migrations from './migrations/migrations';

/** Pokreće Drizzle migracije pri startu; vraća { success, error } (§F1). */
export function useDbMigrations(): { success: boolean; error?: Error } {
  return useMigrations(db, migrations);
}
