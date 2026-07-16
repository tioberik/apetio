import { asc, desc, eq, sql } from 'drizzle-orm';

import {
  type NewRecipe,
  type NewRecipeItem,
  type Recipe,
  type RecipeItem,
  recipeItems,
  recipes,
} from '@/db/schema';
import type { AppDatabase } from '@/db/types';

export interface RecipeWithTotals extends Recipe {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  itemCount: number;
}

/** Lista recepata s totalima — JEDAN upit `JOIN … GROUP BY recipe_id` (§17), ne po receptu. */
export function listRecipesWithTotals(db: AppDatabase): RecipeWithTotals[] {
  return db
    .select({
      id: recipes.id,
      name: recipes.name,
      portions: recipes.portions,
      useCount: recipes.useCount,
      lastUsed: recipes.lastUsed,
      createdAt: recipes.createdAt,
      kcal: sql<number>`coalesce(sum(${recipeItems.kcal}), 0)`,
      protein: sql<number>`coalesce(sum(${recipeItems.protein}), 0)`,
      fat: sql<number>`coalesce(sum(${recipeItems.fat}), 0)`,
      carbs: sql<number>`coalesce(sum(${recipeItems.carbs}), 0)`,
      itemCount: sql<number>`count(${recipeItems.id})`,
    })
    .from(recipes)
    .leftJoin(recipeItems, eq(recipeItems.recipeId, recipes.id))
    .groupBy(recipes.id)
    .orderBy(desc(recipes.useCount), asc(recipes.name))
    .all();
}

export function getRecipeItems(db: AppDatabase, recipeId: string): RecipeItem[] {
  return db.select().from(recipeItems).where(eq(recipeItems.recipeId, recipeId)).all();
}

/** Recept + sastojci u JEDNOJ transakciji — pola zapisanog recepta = korupcija (§17). */
export function insertRecipeWithItems(
  db: AppDatabase,
  recipe: NewRecipe,
  items: NewRecipeItem[],
): void {
  db.transaction((tx) => {
    tx.insert(recipes).values(recipe).run();
    for (const item of items) tx.insert(recipeItems).values(item).run();
  });
}

export function deleteRecipe(db: AppDatabase, id: string): void {
  // recipe_items brišu se kaskadno (ON DELETE CASCADE, §5) — uz PRAGMA foreign_keys=ON.
  db.delete(recipes).where(eq(recipes.id, id)).run();
}
