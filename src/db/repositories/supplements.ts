import { and, asc, eq } from 'drizzle-orm';

import {
  type NewSupplement,
  type Supplement,
  type SupplementLogRow,
  supplementLog,
  supplements,
} from '@/db/schema';
import type { AppDatabase } from '@/db/types';

export function listSupplements(db: AppDatabase): Supplement[] {
  return db.select().from(supplements).orderBy(asc(supplements.sort), asc(supplements.name)).all();
}

export function insertSupplement(db: AppDatabase, supplement: NewSupplement): void {
  db.insert(supplements).values(supplement).run();
}

export function updateSupplement(
  db: AppDatabase,
  id: string,
  patch: Partial<Omit<NewSupplement, 'id'>>,
): void {
  db.update(supplements).set(patch).where(eq(supplements.id, id)).run();
}

export function deleteSupplement(db: AppDatabase, id: string): void {
  db.delete(supplements).where(eq(supplements.id, id)).run();
}

/** Log doza za jedan dan (svi suplementi). */
export function getSupplementLog(db: AppDatabase, date: string): SupplementLogRow[] {
  return db.select().from(supplementLog).where(eq(supplementLog.date, date)).all();
}

/** Postavi broj uzetih doza za (dan, suplement) — upsert. */
export function setSupplementTaken(
  db: AppDatabase,
  date: string,
  supplementId: string,
  takenCount: number,
): void {
  db.insert(supplementLog)
    .values({ date, supplementId, takenCount })
    .onConflictDoUpdate({
      target: [supplementLog.date, supplementLog.supplementId],
      set: { takenCount },
    })
    .run();
}

export function getSupplementTaken(
  db: AppDatabase,
  date: string,
  supplementId: string,
): number {
  const row = db
    .select()
    .from(supplementLog)
    .where(and(eq(supplementLog.date, date), eq(supplementLog.supplementId, supplementId)))
    .get();
  return row?.takenCount ?? 0;
}
