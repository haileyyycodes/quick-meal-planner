import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import type { NextRequest } from 'next/server';
import { turso } from './turso';

const typeDefs = `
  enum Category {
    Breakfast
    Brunch
    Lunch
    Dinner
    Snack
    Drinks
  }

  enum TimeBucket {
    UNDER_30
    THIRTY_TO_60
    OVER_60
  }

  input RecipeFilterInput {
    name: String
    ingredient: String
    cuisine: String
    tags: [String!]
    category: Category
    timeBucket: TimeBucket
  }

  type Query {
    hello: String
    recipes(filter: RecipeFilterInput): [Recipe!]!
    recipe(id: Int!): Recipe
    ingredients(search: String): [Ingredient!]!
    cuisines(search: String): [Cuisine!]!
    tags(search: String): [Tag!]!
  }

  type Mutation {
    createRecipe(input: RecipeInput!): Recipe!
    updateRecipe(id: Int!, input: RecipeInput!): Recipe!
    deleteRecipe(id: Int!): Boolean!
  }

  input RecipeInput {
    name: String!
    category: Category
    cuisine: String
    servings: Int
    yieldQuantity: Float
    yieldUnit: String
    totalTime: Int
    activeTime: Int
    restTime: Int
    originalRecipeLink: String
    notes: String
    ingredients: [RecipeIngredientInput!]
    instructions: [StepInput!]
    tags: [String!]
  }

  input RecipeIngredientInput {
    ingredient: String!
    quantity: Float
    unit: String!
    prepNote: String
  }

  input StepInput {
    order: Int!
    text: String!
  }

  type Recipe {
    id: Int!
    name: String!
    category: String
    cuisine: Cuisine
    servings: Int
    yieldQuantity: Float
    yieldUnit: String
    totalTime: Int
    activeTime: Int
    restTime: Int
    originalRecipeLink: String
    notes: String
    draft: Boolean!
    tags: [Tag!]!
    ingredients: [RecipeIngredient!]!
    steps: [Step!]!
  }

  type Cuisine {
    id: Int!
    name: String!
  }

  type Tag {
    id: Int!
    name: String!
  }

  type RecipeIngredient {
    id: Int!
    ingredient: Ingredient!
    quantity: Float
    unit: String!
    prepNote: String
  }

  type Ingredient {
    id: Int!
    name: String!
  }

  type Step {
    id: Int!
    order: Int!
    text: String!
  }
`;

type RecipeFilterInput = {
  name?: string | null;
  ingredient?: string | null;
  cuisine?: string | null;
  tags?: string[] | null;
  category?: string | null;
  timeBucket?: 'UNDER_30' | 'THIRTY_TO_60' | 'OVER_60' | null;
};

type RecipeIngredientInputShape = {
  ingredient: string;
  quantity?: number | null;
  unit: string;
  prepNote?: string | null;
};

type StepInputShape = {
  order: number;
  text: string;
};

type RecipeInputShape = {
  name: string;
  category?: string | null;
  cuisine?: string | null;
  servings?: number | null;
  yieldQuantity?: number | null;
  yieldUnit?: string | null;
  totalTime?: number | null;
  activeTime?: number | null;
  restTime?: number | null;
  originalRecipeLink?: string | null;
  notes?: string | null;
  ingredients?: RecipeIngredientInputShape[] | null;
  instructions?: StepInputShape[] | null;
  tags?: string[] | null;
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  return Number(value);
};

const toString = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const getRecipeBaseFields = (row: Record<string, unknown>) => ({
  id: Number(row.id),
  name: String(row.name),
  category: toString(row.category),
  servings: toNumber(row.servings),
  yieldQuantity: toNumber(row.yield_quantity),
  yieldUnit: toString(row.yield_unit),
  totalTime: toNumber(row.totalTime),
  activeTime: toNumber(row.activeTime),
  restTime: toNumber(row.restTime),
  originalRecipeLink: toString(row.original_recipe_link),
  notes: toString(row.notes),
});

const createOrFindEntity = async (table: 'cuisines' | 'tags' | 'ingredients', name: string) => {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Entity name cannot be empty.');

  const existing = await turso.execute({
    sql: `SELECT id FROM ${table} WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    args: [normalizedName],
  });

  if (existing.rows.length > 0) {
    return Number(existing.rows[0].id);
  }

  const inserted = await turso.execute({
    sql: `INSERT INTO ${table} (name) VALUES (?)`,
    args: [normalizedName],
  });

  return Number(inserted.lastInsertRowid ?? 0);
};

const buildRecipeFilterClause = (filter?: RecipeFilterInput | null) => {
  const clauses: string[] = [];
  const params: Array<string | number | null> = [];

  if (filter?.name?.trim()) {
    clauses.push('LOWER(r.name) LIKE ?');
    params.push(`%${filter.name.trim().toLowerCase()}%`);
  }

  if (filter?.ingredient?.trim()) {
    clauses.push(`r.id IN (
      SELECT ri.recipe_id FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE LOWER(i.name) LIKE ?
    )`);
    params.push(`%${filter.ingredient.trim().toLowerCase()}%`);
  }

  if (filter?.cuisine?.trim()) {
    clauses.push('LOWER(c.name) LIKE ?');
    params.push(`%${filter.cuisine.trim().toLowerCase()}%`);
  }

  if (filter?.category) {
    clauses.push('r.category = ?');
    params.push(filter.category);
  }

  if (filter?.tags && filter.tags.length > 0) {
    const tagNames = filter.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    if (tagNames.length > 0) {
      const placeholders = tagNames.map(() => '?').join(', ');
      clauses.push(`r.id IN (
        SELECT rt.recipe_id FROM recipe_tags rt
        JOIN tags t ON t.id = rt.tag_id
        WHERE LOWER(t.name) IN (${placeholders})
        GROUP BY rt.recipe_id
        HAVING COUNT(DISTINCT LOWER(t.name)) = ?
      )`);
      params.push(...tagNames, tagNames.length);
    }
  }

  if (filter?.timeBucket === 'UNDER_30') {
    clauses.push('r.total_time IS NOT NULL AND r.total_time < 30');
  } else if (filter?.timeBucket === 'THIRTY_TO_60') {
    clauses.push('r.total_time IS NOT NULL AND r.total_time >= 30 AND r.total_time <= 60');
  } else if (filter?.timeBucket === 'OVER_60') {
    clauses.push('r.total_time IS NOT NULL AND r.total_time > 60');
  }

  return { clauses, params };
};

const insertRecipeChildren = async (recipeId: number, input: RecipeInputShape) => {
  if (input.tags && input.tags.length > 0) {
    for (const tagValue of input.tags) {
      const tagName = tagValue?.trim();
      if (!tagName) continue;
      const tagId = await createOrFindEntity('tags', tagName);
      await turso.execute({
        sql: 'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
        args: [recipeId, tagId],
      });
    }
  }

  if (input.ingredients && input.ingredients.length > 0) {
    for (let index = 0; index < input.ingredients.length; index += 1) {
      const ingredientInput = input.ingredients[index];
      const ingredientName = ingredientInput.ingredient?.trim();
      if (!ingredientName) continue;

      const ingredientId = await createOrFindEntity('ingredients', ingredientName);
      await turso.execute({
        sql: `
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, prep_note, ingredient_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          recipeId,
          ingredientId,
          ingredientInput.quantity ?? null,
          ingredientInput.unit ?? 'each',
          ingredientInput.prepNote ?? null,
          index,
        ],
      });
    }
  }

  if (input.instructions && input.instructions.length > 0) {
    for (const step of input.instructions) {
      if (!step?.text?.trim()) continue;
      await turso.execute({
        sql: 'INSERT INTO steps (recipe_id, step_order, text) VALUES (?, ?, ?)',
        args: [recipeId, step.order ?? 0, step.text.trim()],
      });
    }
  }
};

const clearRecipeChildren = async (recipeId: number) => {
  await turso.execute({ sql: 'DELETE FROM recipe_tags WHERE recipe_id = ?', args: [recipeId] });
  await turso.execute({ sql: 'DELETE FROM recipe_ingredients WHERE recipe_id = ?', args: [recipeId] });
  await turso.execute({ sql: 'DELETE FROM steps WHERE recipe_id = ?', args: [recipeId] });
};

const RECIPE_BASE_SELECT = `
  SELECT r.id, r.name, r.category, r.servings, r.yield_quantity, r.yield_unit, r.total_time AS totalTime,
         r.active_time AS activeTime, r.rest_time AS restTime, r.original_recipe_link,
         r.notes, c.id AS cuisine_id, c.name AS cuisine_name
  FROM recipes r
  LEFT JOIN cuisines c ON c.id = r.cuisine_id
`;

const mapEntityRows = (rows: Record<string, unknown>[]) =>
  rows.map((row) => ({ id: Number(row.id), name: String(row.name) }));

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL',
    recipes: async (_parent: unknown, args: { filter?: RecipeFilterInput }) => {
      const { clauses, params } = buildRecipeFilterClause(args.filter);
      const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

      const result = await turso.execute({
        sql: `${RECIPE_BASE_SELECT} ${whereSql} ORDER BY r.name COLLATE NOCASE ASC`,
        args: params,
      });

      return result.rows.map((row) => ({
        ...getRecipeBaseFields(row as Record<string, unknown>),
        cuisine: row.cuisine_id ? { id: Number(row.cuisine_id), name: String(row.cuisine_name) } : null,
      }));
    },
    recipe: async (_parent: unknown, args: { id: number }) => {
      const result = await turso.execute({
        sql: `${RECIPE_BASE_SELECT} WHERE r.id = ?`,
        args: [args.id],
      });

      const row = result.rows[0] as Record<string, unknown> | undefined;
      if (!row) return null;

      return {
        ...getRecipeBaseFields(row),
        cuisine: row.cuisine_id ? { id: Number(row.cuisine_id), name: String(row.cuisine_name) } : null,
      };
    },
    ingredients: async (_parent: unknown, args: { search?: string }) => {
      const search = args.search?.trim().toLowerCase();
      const result = await turso.execute(
        search
          ? {
              sql: 'SELECT id, name FROM ingredients WHERE LOWER(name) LIKE ? ORDER BY name COLLATE NOCASE ASC LIMIT 50',
              args: [`%${search}%`],
            }
          : { sql: 'SELECT id, name FROM ingredients ORDER BY name COLLATE NOCASE ASC LIMIT 50', args: [] }
      );
      return mapEntityRows(result.rows as Record<string, unknown>[]);
    },
    cuisines: async (_parent: unknown, args: { search?: string }) => {
      const search = args.search?.trim().toLowerCase();
      const result = await turso.execute(
        search
          ? {
              sql: 'SELECT id, name FROM cuisines WHERE LOWER(name) LIKE ? ORDER BY name COLLATE NOCASE ASC LIMIT 50',
              args: [`%${search}%`],
            }
          : { sql: 'SELECT id, name FROM cuisines ORDER BY name COLLATE NOCASE ASC LIMIT 50', args: [] }
      );
      return mapEntityRows(result.rows as Record<string, unknown>[]);
    },
    tags: async (_parent: unknown, args: { search?: string }) => {
      const search = args.search?.trim().toLowerCase();
      const result = await turso.execute(
        search
          ? {
              sql: 'SELECT id, name FROM tags WHERE LOWER(name) LIKE ? ORDER BY name COLLATE NOCASE ASC LIMIT 50',
              args: [`%${search}%`],
            }
          : { sql: 'SELECT id, name FROM tags ORDER BY name COLLATE NOCASE ASC LIMIT 50', args: [] }
      );
      return mapEntityRows(result.rows as Record<string, unknown>[]);
    },
  },
  Mutation: {
    createRecipe: async (_parent: unknown, args: { input: RecipeInputShape }) => {
      const name = args.input.name?.trim();
      if (!name) {
        throw new Error('Recipe name is required.');
      }

      let cuisineId: number | null = null;
      if (args.input.cuisine && args.input.cuisine.trim()) {
        cuisineId = await createOrFindEntity('cuisines', args.input.cuisine);
      }

      const recipeInsert = await turso.execute({
        sql: `
          INSERT INTO recipes (
            name, category, cuisine_id, servings, yield_quantity, yield_unit, total_time,
            active_time, rest_time, original_recipe_link, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          name,
          args.input.category ?? null,
          cuisineId,
          args.input.servings ?? null,
          args.input.yieldQuantity ?? null,
          args.input.yieldUnit ?? null,
          args.input.totalTime ?? null,
          args.input.activeTime ?? null,
          args.input.restTime ?? null,
          args.input.originalRecipeLink ?? null,
          args.input.notes ?? null,
        ],
      });

      const recipeId = Number(recipeInsert.lastInsertRowid ?? 0);
      await insertRecipeChildren(recipeId, args.input);

      return {
        id: recipeId,
        name,
        category: args.input.category ?? null,
        totalTime: args.input.totalTime ?? null,
      };
    },
    updateRecipe: async (_parent: unknown, args: { id: number; input: RecipeInputShape }) => {
      const name = args.input.name?.trim();
      if (!name) {
        throw new Error('Recipe name is required.');
      }

      const existing = await turso.execute({ sql: 'SELECT id FROM recipes WHERE id = ?', args: [args.id] });
      if (existing.rows.length === 0) {
        throw new Error('Recipe not found.');
      }

      let cuisineId: number | null = null;
      if (args.input.cuisine && args.input.cuisine.trim()) {
        cuisineId = await createOrFindEntity('cuisines', args.input.cuisine);
      }

      await turso.execute({
        sql: `
          UPDATE recipes SET
            name = ?, category = ?, cuisine_id = ?, servings = ?, yield_quantity = ?, yield_unit = ?,
            total_time = ?, active_time = ?, rest_time = ?, original_recipe_link = ?,
            notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [
          name,
          args.input.category ?? null,
          cuisineId,
          args.input.servings ?? null,
          args.input.yieldQuantity ?? null,
          args.input.yieldUnit ?? null,
          args.input.totalTime ?? null,
          args.input.activeTime ?? null,
          args.input.restTime ?? null,
          args.input.originalRecipeLink ?? null,
          args.input.notes ?? null,
          args.id,
        ],
      });

      await clearRecipeChildren(args.id);
      await insertRecipeChildren(args.id, args.input);

      return {
        id: args.id,
        name,
        category: args.input.category ?? null,
        totalTime: args.input.totalTime ?? null,
      };
    },
    deleteRecipe: async (_parent: unknown, args: { id: number }) => {
      await clearRecipeChildren(args.id);
      const result = await turso.execute({ sql: 'DELETE FROM recipes WHERE id = ?', args: [args.id] });
      return (result.rowsAffected ?? 0) > 0;
    },
  },
  Recipe: {
    cuisine: async (parent: { id: number; cuisine?: { id: number; name: string } | null }) => {
      if (parent.cuisine !== undefined) return parent.cuisine;
      const result = await turso.execute({
        sql: 'SELECT c.id, c.name FROM cuisines c JOIN recipes r ON r.cuisine_id = c.id WHERE r.id = ?',
        args: [parent.id],
      });

      const cuisineRow = result.rows[0] as Record<string, unknown> | undefined;
      if (!cuisineRow) return null;

      return { id: Number(cuisineRow.id), name: String(cuisineRow.name) };
    },
    tags: async (parent: { id: number }) => {
      const result = await turso.execute({
        sql: `
          SELECT t.id, t.name
          FROM recipe_tags rt
          JOIN tags t ON t.id = rt.tag_id
          WHERE rt.recipe_id = ?
          ORDER BY t.name ASC
        `,
        args: [parent.id],
      });

      return mapEntityRows(result.rows as Record<string, unknown>[]);
    },
    ingredients: async (parent: { id: number }) => {
      const result = await turso.execute({
        sql: `
          SELECT ri.id, ri.quantity, ri.unit, ri.prep_note,
                 i.id AS ingredient_id, i.name AS ingredient_name
          FROM recipe_ingredients ri
          JOIN ingredients i ON i.id = ri.ingredient_id
          WHERE ri.recipe_id = ?
          ORDER BY ri.ingredient_order ASC
        `,
        args: [parent.id],
      });

      return result.rows.map((row) => ({
        id: Number(row.id),
        quantity: toNumber(row.quantity),
        unit: String(row.unit),
        prepNote: toString(row.prep_note),
        ingredient: { id: Number(row.ingredient_id), name: String(row.ingredient_name) },
      }));
    },
    steps: async (parent: { id: number }) => {
      const result = await turso.execute({
        sql: 'SELECT id, step_order AS "order", text FROM steps WHERE recipe_id = ? ORDER BY step_order ASC',
        args: [parent.id],
      });

      return result.rows.map((row) => ({
        id: Number(row.id),
        order: Number(row.order),
        text: String(row.text),
      }));
    },
    draft: async (parent: { id: number; category?: string | null; totalTime?: number | null; name?: string }) => {
      if (!parent.category || parent.totalTime === null || parent.totalTime === undefined || !parent.name) {
        return true;
      }

      const [ingredientCount, stepCount] = await Promise.all([
        turso.execute({ sql: 'SELECT COUNT(*) AS count FROM recipe_ingredients WHERE recipe_id = ?', args: [parent.id] }),
        turso.execute({ sql: 'SELECT COUNT(*) AS count FROM steps WHERE recipe_id = ?', args: [parent.id] }),
      ]);

      const ingredientTotal = Number(ingredientCount.rows[0]?.count ?? 0);
      const stepTotal = Number(stepCount.rows[0]?.count ?? 0);

      return ingredientTotal === 0 || stepTotal === 0;
    },
  },
  RecipeIngredient: {
    ingredient: (parent: { ingredient: { id: number; name: string } }) => parent.ingredient,
  },
};

export const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
});
