import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle shema — §5 spec. Sve nutritivne vrijednosti su STVARNE za navedenu količinu
 * (ne na 100 g). Datumi su lokalni 'YYYY-MM-DD' (§16), nikad UTC.
 */

// Namirnice (osobna baza; sjeme buduće regionalne baze — §7)
export const foods = sqliteTable(
  'foods',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    brand: text('brand'),
    barcode: text('barcode'),
    unit: text('unit').notNull(),
    baseAmount: real('base_amount').notNull(),
    kcal: real('kcal').notNull(),
    protein: real('protein').notNull(),
    fat: real('fat').notNull(),
    carbs: real('carbs').notNull(),
    source: text('source'),
    verified: integer('verified').notNull().default(0),
    useCount: integer('use_count').notNull().default(1),
    lastUsed: text('last_used'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    check('foods_unit_check', sql`${t.unit} in ('g','kom')`),
    check('foods_base_amount_check', sql`${t.baseAmount} > 0`),
  ],
);

// Dnevnički unosi (snapshot vrijednosti u trenutku unosa — izmjena namirnice NE mijenja povijest)
export const diaryEntries = sqliteTable(
  'diary_entries',
  {
    id: text('id').primaryKey(),
    date: text('date').notNull(),
    meal: text('meal').notNull(),
    name: text('name').notNull(),
    unit: text('unit').notNull(),
    amount: real('amount').notNull(),
    kcal: real('kcal').notNull(),
    protein: real('protein').notNull(),
    fat: real('fat').notNull(),
    carbs: real('carbs').notNull(),
    source: text('source'),
    recipeId: text('recipe_id'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [
    index('idx_diary_date').on(t.date),
    check('diary_meal_check', sql`${t.meal} in ('dorucak','rucak','vecera','uzina')`),
    check('diary_amount_check', sql`${t.amount} > 0`),
  ],
);

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  portions: real('portions').notNull().default(1),
  useCount: integer('use_count').notNull().default(0),
  lastUsed: text('last_used'),
  createdAt: text('created_at').notNull(),
});

export const recipeItems = sqliteTable('recipe_items', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  amount: real('amount').notNull(),
  kcal: real('kcal').notNull(),
  protein: real('protein').notNull(),
  fat: real('fat').notNull(),
  carbs: real('carbs').notNull(),
});

export const dayMeta = sqliteTable('day_meta', {
  date: text('date').primaryKey(),
  waterMl: integer('water_ml').notNull().default(0),
});

export const supplements = sqliteTable(
  'supplements',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    detail: text('detail'),
    doses: integer('doses').notNull().default(1),
    sort: integer('sort').notNull().default(0),
    reminderTime: text('reminder_time'),
  },
  (t) => [check('supplements_doses_check', sql`${t.doses} between 1 and 3`)],
);

export const supplementLog = sqliteTable(
  'supplement_log',
  {
    date: text('date').notNull(),
    supplementId: text('supplement_id').notNull(),
    takenCount: integer('taken_count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.date, t.supplementId] })],
);

export const weightLog = sqliteTable('weight_log', {
  date: text('date').primaryKey(),
  kg: real('kg').notNull(),
});

// --- Inferirani tipovi ---
export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type NewDiaryEntry = typeof diaryEntries.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type RecipeItem = typeof recipeItems.$inferSelect;
export type NewRecipeItem = typeof recipeItems.$inferInsert;
export type DayMeta = typeof dayMeta.$inferSelect;
export type Supplement = typeof supplements.$inferSelect;
export type NewSupplement = typeof supplements.$inferInsert;
export type SupplementLogRow = typeof supplementLog.$inferSelect;
export type WeightLogRow = typeof weightLog.$inferSelect;

export type Meal = 'dorucak' | 'rucak' | 'vecera' | 'uzina';
export type Unit = 'g' | 'kom';
export const MEALS: readonly Meal[] = ['dorucak', 'rucak', 'vecera', 'uzina'];
