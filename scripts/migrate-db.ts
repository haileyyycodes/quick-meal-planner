import dotenv from 'dotenv';
import { turso } from '../lib/turso';

dotenv.config({ path: '.env.local' });

const statements = [
  `CREATE TABLE IF NOT EXISTS cuisines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );`,
  `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );`,
  `CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );`,
  `CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cuisine_id INTEGER,
    category TEXT,
    servings INTEGER,
    yield_quantity REAL,
    yield_unit TEXT,
    total_time INTEGER,
    active_time INTEGER,
    rest_time INTEGER,
    original_recipe_link TEXT,
    instructions TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuisine_id) REFERENCES cuisines(id)
  );`,
  `CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL,
    unit TEXT NOT NULL,
    prep_note TEXT,
    ingredient_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
  );`,
  `CREATE TABLE IF NOT EXISTS recipe_tags (
    recipe_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (recipe_id, tag_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS units (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL UNIQUE
  );`,
  `INSERT OR IGNORE INTO units (key, label) VALUES
    ('cup', 'cup'),
    ('tbsp', 'tbsp'),
    ('tsp', 'tsp'),
    ('fl_oz', 'fl oz'),
    ('oz', 'oz'),
    ('lb', 'lb'),
    ('g', 'g'),
    ('kg', 'kg'),
    ('mg', 'mg'),
    ('ml', 'ml'),
    ('l', 'l'),
    ('clove', 'clove'),
    ('pinch', 'pinch'),
    ('dash', 'dash'),
    ('can', 'can'),
    ('jar', 'jar'),
    ('bottle', 'bottle'),
    ('package', 'package'),
    ('box', 'box'),
    ('whole', 'whole'),
    ('stick', 'stick'),
    ('each', 'each'),
    ('to_taste', 'to taste'),
    ('as_needed', 'as needed');`,
];

// Schema changes to existing tables. ALTER TABLE isn't idempotent like CREATE TABLE IF NOT EXISTS,
// so each statement is run individually and a "column already exists"/"no such column" error is
// swallowed to keep this script safe to re-run.
const alterStatements = [
  `ALTER TABLE recipes ADD COLUMN yield_quantity REAL;`,
  `ALTER TABLE recipes ADD COLUMN yield_unit TEXT;`,
  `ALTER TABLE recipes DROP COLUMN yield_label;`,
  `ALTER TABLE recipe_ingredients DROP COLUMN size_quantity;`,
  `ALTER TABLE recipe_ingredients DROP COLUMN size_unit;`,
  `ALTER TABLE recipes ADD COLUMN description TEXT;`,
  `ALTER TABLE recipes ADD COLUMN instructions TEXT;`,
];

// One-time backfill: instructions used to live as ordered rows in a `steps` table. Each step's
// text was already a Tiptap-produced `<p>...</p>` fragment, so concatenating them in order
// reproduces the same multi-paragraph rich text the new single `instructions` field expects.
async function backfillInstructionsFromSteps() {
  let stepsTableExists = true;
  try {
    await turso.execute('SELECT 1 FROM steps LIMIT 1;');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/no such table/i.test(message)) {
      stepsTableExists = false;
    } else {
      throw error;
    }
  }

  if (!stepsTableExists) {
    console.log('Skipped steps backfill: steps table no longer exists.');
    return;
  }

  const recipes = await turso.execute(
    `SELECT id FROM recipes WHERE instructions IS NULL OR instructions = '';`
  );

  for (const row of recipes.rows) {
    const recipeId = Number(row.id);
    const steps = await turso.execute({
      sql: 'SELECT text FROM steps WHERE recipe_id = ? ORDER BY step_order ASC',
      args: [recipeId],
    });
    if (steps.rows.length === 0) continue;

    const instructions = steps.rows.map((stepRow) => String(stepRow.text)).join('');
    await turso.execute({
      sql: 'UPDATE recipes SET instructions = ? WHERE id = ?',
      args: [instructions, recipeId],
    });
  }

  console.log(`Backfilled instructions for ${recipes.rows.length} recipe(s) from steps.`);
  await turso.execute('DROP TABLE IF EXISTS steps;');
  console.log('Dropped steps table.');
}

async function main() {
  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    await turso.execute(statement);
    console.log(`Executed migration step ${index + 1}/${statements.length}`);
  }

  for (const statement of alterStatements) {
    try {
      await turso.execute(statement);
      console.log(`Executed alter statement: ${statement.trim()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/duplicate column name|no such column/i.test(message)) {
        console.log(`Skipped (already applied): ${statement.trim()}`);
      } else {
        throw error;
      }
    }
  }

  await backfillInstructionsFromSteps();

  console.log('Database schema ready.');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
