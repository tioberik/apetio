import { asc, desc, eq, sql } from 'drizzle-orm';

import { type Food, type NewFood, foods } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

/** Sve namirnice — JEDAN upit `ORDER BY use_count DESC, name` (§17). */
export function listFoods(db: AppDatabase): Food[] {
  return db.select().from(foods).orderBy(desc(foods.useCount), asc(foods.name)).all();
}

/** Sekcija "Često" — top N po korištenju. */
export function getFrequentFoods(db: AppDatabase, limit = 8): Food[] {
  return db
    .select()
    .from(foods)
    .orderBy(desc(foods.useCount), desc(foods.lastUsed))
    .limit(limit)
    .all();
}

export function findFoodByBarcode(db: AppDatabase, barcode: string): Food | undefined {
  return db.select().from(foods).where(eq(foods.barcode, barcode)).get();
}

export function insertFood(db: AppDatabase, food: NewFood): void {
  db.insert(foods).values(food).run();
}

export function updateFood(db: AppDatabase, id: string, patch: Partial<Omit<NewFood, 'id'>>): void {
  db.update(foods).set(patch).where(eq(foods.id, id)).run();
}

export function deleteFood(db: AppDatabase, id: string): void {
  db.delete(foods).where(eq(foods.id, id)).run();
}

/** Bump `use_count` + `last_used` pri dodavanju namirnice u dnevnik. */
export function bumpFoodUsage(db: AppDatabase, id: string, lastUsed: string): void {
  db.update(foods)
    .set({ useCount: sql`${foods.useCount} + 1`, lastUsed })
    .where(eq(foods.id, id))
    .run();
}
