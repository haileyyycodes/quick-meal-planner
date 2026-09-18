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
  sizeQuantity: number | null;
  sizeUnit: string | null;
  prepNote: string | null;
};

export type Step = {
  id: number;
  order: number;
  text: string;
};

export type Recipe = {
  id: number;
  name: string;
  category: Category | null;
  cuisine: NamedEntity | null;
  servings: number | null;
  yieldQuantity: number | null;
  yieldUnit: string | null;
  totalTime: number | null;
  activeTime: number | null;
  restTime: number | null;
  originalRecipeLink: string | null;
  notes: string | null;
  draft: boolean;
  tags: NamedEntity[];
  ingredients: RecipeIngredient[];
  steps: Step[];
};

export type RecipeFilterInput = {
  name?: string;
  ingredient?: string;
  cuisine?: string;
  tags?: string[];
  category?: Category;
  timeBucket?: TimeBucket;
};

export type RecipeIngredientInput = {
  ingredient: string;
  quantity: number | null;
  unit: string;
  sizeQuantity: number | null;
  sizeUnit: string | null;
  prepNote: string | null;
};

export type StepInput = {
  order: number;
  text: string;
};

export type RecipeInput = {
  name: string;
  category: Category | null;
  cuisine: string | null;
  servings: number | null;
  yieldQuantity: number | null;
  yieldUnit: string | null;
  totalTime: number | null;
  activeTime: number | null;
  restTime: number | null;
  originalRecipeLink: string | null;
  notes: string | null;
  ingredients: RecipeIngredientInput[];
  instructions: StepInput[];
  tags: string[];
};
