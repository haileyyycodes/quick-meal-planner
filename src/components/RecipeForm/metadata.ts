import type { Recipe, RecipeInput } from '@/src/lib/graphql/types';

export type RecipeMetadataState = {
  name: string;
  category: string;
  cuisine: string;
  tags: string[];
  activeTime: string;
  restTime: string;
  servings: string;
  yieldQuantity: string;
  yieldUnit: string;
  originalRecipeLink: string;
};

export const EMPTY_METADATA: RecipeMetadataState = {
  name: '',
  category: '',
  cuisine: '',
  tags: [],
  activeTime: '',
  restTime: '',
  servings: '',
  yieldQuantity: '',
  yieldUnit: '',
  originalRecipeLink: '',
};

export function metadataFromRecipe(recipe?: Recipe): RecipeMetadataState {
  if (!recipe) return EMPTY_METADATA;
  return {
    name: recipe.name,
    category: recipe.category ?? '',
    cuisine: recipe.cuisine?.name ?? '',
    tags: recipe.tags.map((tag) => tag.name),
    activeTime: recipe.activeTime != null ? String(recipe.activeTime) : '',
    restTime: recipe.restTime != null ? String(recipe.restTime) : '',
    servings: recipe.servings != null ? String(recipe.servings) : '',
    yieldQuantity: recipe.yieldQuantity != null ? String(recipe.yieldQuantity) : '',
    yieldUnit: recipe.yieldUnit ?? '',
    originalRecipeLink: recipe.originalRecipeLink ?? '',
  };
}

export function parseNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function computeTotalTime(activeTime: string, restTime: string): number | null {
  const activeMinutes = parseNumber(activeTime);
  const restMinutes = parseNumber(restTime);
  return activeMinutes == null && restMinutes == null ? null : (activeMinutes ?? 0) + (restMinutes ?? 0);
}

type MetadataInput = Pick<
  RecipeInput,
  | 'name'
  | 'category'
  | 'cuisine'
  | 'servings'
  | 'yieldQuantity'
  | 'yieldUnit'
  | 'totalTime'
  | 'activeTime'
  | 'restTime'
  | 'originalRecipeLink'
  | 'tags'
>;

export function metadataToInput(value: RecipeMetadataState): MetadataInput {
  return {
    name: value.name.trim(),
    category: value.category ? (value.category as RecipeInput['category']) : null,
    cuisine: value.cuisine.trim() || null,
    servings: parseNumber(value.servings),
    yieldQuantity: parseNumber(value.yieldQuantity),
    yieldUnit: value.yieldUnit.trim() || null,
    totalTime: computeTotalTime(value.activeTime, value.restTime),
    activeTime: parseNumber(value.activeTime),
    restTime: parseNumber(value.restTime),
    originalRecipeLink: value.originalRecipeLink.trim() || null,
    tags: value.tags,
  };
}
