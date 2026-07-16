import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';

import { type DiaryEntry, type NewDiaryEntry, diaryEntries } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

export interface DayTotals {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface DateTotals extends DayTotals {
  date: string;
}

const SUM_COLUMNS = {
  kcal: sql<number>`coalesce(sum(${diaryEntries.kcal}), 0)`,
  protein: sql<number>`coalesce(sum(${diaryEntries.protein}), 0)`,
  fat: sql<number>`coalesce(sum(${diaryEntries.fat}), 0)`,
  carbs: sql<number>`coalesce(sum(${diaryEntries.carbs}), 0)`,
};

/** Svi unosi jednog dana — JEDAN upit; podjela po obrocima ide u memoriji (§17). */
export function getDayEntries(db: AppDatabase, date: string): DiaryEntry[] {
  return db
    .select()
    .from(diaryEntries)
    .where(eq(diaryEntries.date, date))
    .orderBy(asc(diaryEntries.createdAt))
    .all();
}

/** Totali jednog dana (agregatni upit, ne petlja). */
export function getDayTotals(db: AppDatabase, date: string): DayTotals {
  const [row] = db.select(SUM_COLUMNS).from(diaryEntries).where(eq(diaryEntries.date, date)).all();
  return row ?? { kcal: 0, protein: 0, fat: 0, carbs: 0 };
}

/** Totali po danu za raspon (kalendar/grafovi 7/30) — JEDAN upit s GROUP BY (§17). */
export function getRangeTotals(db: AppDatabase, from: string, to: string): DateTotals[] {
  return db
    .select({ date: diaryEntries.date, ...SUM_COLUMNS })
    .from(diaryEntries)
    .where(and(gte(diaryEntries.date, from), lte(diaryEntries.date, to)))
    .groupBy(diaryEntries.date)
    .orderBy(asc(diaryEntries.date))
    .all();
}

export function insertEntry(db: AppDatabase, entry: NewDiaryEntry): void {
  db.insert(diaryEntries).values(entry).run();
}

/** Više unosa u JEDNOJ transakciji ("Ponovi jučer", recept-u-dnevnik) — §17. */
export function insertEntries(db: AppDatabase, entries: NewDiaryEntry[]): void {
  if (entries.length === 0) return;
  db.transaction((tx) => {
    for (const entry of entries) tx.insert(diaryEntries).values(entry).run();
  });
}

export function updateEntry(
  db: AppDatabase,
  id: string,
  patch: Partial<Omit<NewDiaryEntry, 'id'>>,
): void {
  db.update(diaryEntries).set(patch).where(eq(diaryEntries.id, id)).run();
}

export function deleteEntry(db: AppDatabase, id: string): void {
  db.delete(diaryEntries).where(eq(diaryEntries.id, id)).run();
}
