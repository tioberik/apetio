import { eq } from 'drizzle-orm';

import { dayMeta } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

export function getWaterMl(db: AppDatabase, date: string): number {
  const row = db.select().from(dayMeta).where(eq(dayMeta.date, date)).get();
  return row?.waterMl ?? 0;
}

export function setWaterMl(db: AppDatabase, date: string, waterMl: number): void {
  db.insert(dayMeta)
    .values({ date, waterMl })
    .onConflictDoUpdate({ target: dayMeta.date, set: { waterMl } })
    .run();
}
