import { supplements } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

/** Seed vlasnikova protokola pri prvom pokretanju (§5) — idempotentno. */
export function seedSupplementsIfEmpty(db: AppDatabase): void {
  const existing = db.select({ id: supplements.id }).from(supplements).limit(1).all();
  if (existing.length > 0) return;

  db.insert(supplements)
    .values([
      { id: 'kreatin', name: 'Kreatin', detail: '5 g', doses: 1, sort: 0 },
      { id: 'magnezij', name: 'Magnezij glicinat', detail: '300 mg · 2+2 kapsule', doses: 2, sort: 1 },
    ])
    .run();
}
