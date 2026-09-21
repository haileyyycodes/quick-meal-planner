import type { Category, TimeBucket } from '@/src/lib/constants';

export type NamedEntity = {
  id: number;
  name: string;
};

export type RecipeIngredient = {
  id: number;
  ingredient: NamedEntity;
  quantity: number | null;
  unit: string;
  prepNote: string | null;
};

export type Recipe = {
  id: number;
  name: string;
  description: string | null;
  category: Category | null;
  cuisine: NamedEntity | null;
  servings: number | null;
  yieldQuantity: number | null;
  yieldUnit: string | null;
  totalTime: number | null;
  activeTime: number | null;
  restTime: number | null;
  originalRecipeLink: string | null;
  instructions: string | null;
  notes: string | null;
  draft: boolean;
  tags: NamedEntity[];
  ingredients: RecipeIngredient[];
};

export type RecipeFilterInput = {
  name?: string;
  ingredient?: string;
  search?: string;
  cuisine?: string;
  tags?: string[];
  category?: Category;
  timeBucket?: TimeBucket;
};

export type RecipeIngredientInput = {
  ingredient: string;
  quantity: number | null;
  unit: string;
  prepNote: string | null;
};

export type RecipeInput = {
  name: string;
  description: string | null;
  category: Category | null;
  cuisine: string | null;
  servings: number | null;
  yieldQuantity: number | null;
  yieldUnit: string | null;
  totalTime: number | null;
  activeTime: number | null;
  restTime: number | null;
  originalRecipeLink: string | null;
  instructions: string | null;
  notes: string | null;
  ingredients: RecipeIngredientInput[];
  tags: string[];
};
