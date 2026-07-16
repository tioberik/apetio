import { asc, eq } from 'drizzle-orm';

import { type WeightLogRow, weightLog } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

export function listWeights(db: AppDatabase): WeightLogRow[] {
  return db.select().from(weightLog).orderBy(asc(weightLog.date)).all();
}

export function getWeight(db: AppDatabase, date: string): number | undefined {
  return db.select().from(weightLog).where(eq(weightLog.date, date)).get()?.kg;
}

export function upsertWeight(db: AppDatabase, date: string, kg: number): void {
  db.insert(weightLog)
    .values({ date, kg })
    .onConflictDoUpdate({ target: weightLog.date, set: { kg } })
    .run();
}

export function deleteWeight(db: AppDatabase, date: string): void {
  db.delete(weightLog).where(eq(weightLog.date, date)).run();
}
