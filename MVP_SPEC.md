# Digital Cookbook — MVP Spec (Recipe Catalog)

Status: defined, not yet built
Scope: Phase 1 of the broader Digital Cookbook vision (recipe catalog only — no meal planning, no grocery lists, no bulk cooking mode)

## Problem

"What's for dinner?" is currently solved with a printed binder (kept — genuinely useful, not being replaced), a Notion database that hit its block limit, and paper-based weekly meal planning. This MVP replaces the Notion piece: a digital recipe catalog that's fast to search/filter and easy to add to, still meant to be printed and used on paper while actually cooking.

Only users: the author and her husband, both from their own machines via local dev. No public deployment in this phase.

## Stack & Architecture

- **Framework:** Next.js, single app, TypeScript. No monorepo — job-tracker's multi-`DataSource`-implementation pattern (real SQLite file vs. in-browser WASM SQLite) doesn't apply here, since there's only one storage mechanism (Turso over the network), not two fundamentally different runtimes.
- **API layer:** Apollo Server (GraphQL), run inside a Next.js API route. Chosen deliberately to learn the technology, not because the app's complexity requires it.
- **Database:** Turso (hosted libSQL/SQLite). One database for now — "personal" — holding real data.
- **Environments:** Single environment for this MVP. Both household members run `npm run dev` locally on their own machines, each pointed at the same personal Turso DB via env var (connection URL + auth token). No authentication layer — trusted local-dev-only access model.
- **Portfolio/demo deployment:** Explicitly out of scope for this MVP. When revisited later, the plan is: real GraphQL queries against a seeded demo Turso DB for reads, but writes (create/edit/delete) faked entirely client-side (localStorage + artificial delay, never reaching Apollo Server) so public visitors can never write to real infrastructure. Filtering in that future demo mode would need to run client-side against a merge of server-seeded data + the visitor's local overlay, since server-side filtering alone would never surface a visitor's own local-only additions. None of this is being built now — noted here only so the design isn't lost.
- **Query pattern:** Real per-request GraphQL queries (e.g., a new query fires on each filter/search change), resolved server-side against Turso with actual `WHERE` clauses — not a load-everything-on-boot-into-a-client-cache pattern. This is a deliberate portfolio choice: showcasing real request/loading state UX (Apollo Client's `loading`/`error`/`data` states) is a stated goal of this project, not an afterthought.

## Data Model

### Recipe

| Field | Type | Required | Notes |
|---|---|---|---|
| name | String | **Yes** | Only required field — enables drafts |
| instructions | [Step!] | No | Structured list of discrete, reorderable steps |
| ingredients | [RecipeIngredient!] | No | See below |
| notes | RichText | No | Same rich-text treatment as instructions |
| cuisine | Cuisine (nullable ref) | No | Open/creatable vocabulary |
| tags | [Tag!] | No | Open/creatable vocabulary |
| category | Category (enum) | No | Fixed enum — see below |
| servings | Int | No | Recommended required in a future pass once Phase 2 (serving-size scaling) needs it; not enforced now since only Name is required |
| yieldLabel | String | No | Optional free-text yield description, e.g. "makes 24 cookies" |
| totalTime | Int (minutes) | No | Drives the Time filter |
| activeTime | Int (minutes) | No | Display-only for MVP, not filterable |
| restTime | Int (minutes) | No | Display-only for MVP, not filterable |
| originalRecipeLink | String (URL) | No | |

**Draft indicator:** computed, not stored — a recipe is shown with a "Draft" badge whenever `category` is unset, `totalTime` is unset, `ingredients` is empty, or `instructions` (steps) is empty.

**Explicitly deferred to a later phase (not built in this MVP):**
- Printing a recipe
- Adjusting/scaling serving size (ingredient quantities do not recompute)
- Thumbnail image (upload or URL) — full deferral, not even a URL-only stub

### Step (instruction)

```
Step {
  order: Int!
  text: RichText!   // bold, italic, underline only — highlight deferred
}
```

Steps are independently addable, removable, and reorderable in the recipe form — not a single free-typed blob.

### RecipeIngredient (join)

```
RecipeIngredient {
  ingredient: Ingredient!   // FK to open/creatable Ingredient table
  quantity: Float           // nullable — required for "to taste"/"as needed" style entries
  unit: Unit!               // fixed enum, see below
  prepNote: String          // optional, e.g. "diced", "room temperature"
}
```

### Ingredient (open vocabulary)

Freely creatable while entering a recipe — type a name, if it doesn't exist yet it's created. Case-insensitive/trimmed matching to reduce accidental near-duplicates (e.g. "Flour" vs "flour"). No merge/synonym tooling in this MVP — acceptable manual cleanup later.

### Unit (fixed, standardized enum)

Seeded, closed set — not creatable through the UI:

```
cup, tbsp, tsp, fl oz, oz, lb, g, kg, mg, ml, l,
clove, pinch, dash, can, package, whole, stick, each,
to taste, as needed
```

The last several (`pinch`, `dash`, `whole`/`each`, `to taste`, `as needed`) exist specifically so real recipes with non-measurement quantities don't force false precision (e.g. "a pinch of salt" doesn't need to become "0.125 tsp"). `quantity` is nullable to support these.

### Tag (open vocabulary)

Freely creatable, e.g. "Quick," "All day," "Sunday dinner." No fixed list.

### Cuisine (open vocabulary)

Freely creatable, e.g. "Mexican," "American." No fixed list — deliberately not pre-seeded or gatekept.

### Category (fixed enum)

```
Breakfast, Brunch, Lunch, Dinner, Snack, Drinks
```

Fixed (not creatable) because Phase 3+ (meal planning) slots recipes into these exact positions on a weekly grid — an open vocabulary here would eventually conflict with that structure.

## Recipe Capabilities (MVP)

1. View recipes in a compact list (not a card grid — thumbnails are deferred, so a grid layout has nothing to differentiate on)
2. Filter/search by:
   - Name (substring match)
   - Ingredient
   - Cuisine
   - Tags
   - Category
   - Total Time, as **bucketed presets** (e.g. Under 30 min / 30–60 min / 1hr+) — not exact range/slider input, and measured against **Total Time only** (not Active or Rest Time)
3. Create / view / edit / delete a recipe
4. Manual entry only — no recipe scraper or importer in this MVP (planned for a later phase)

## Explicitly Out of Scope for This MVP

- Printing a recipe
- Serving-size scaling (ingredient quantities do not recompute)
- Thumbnail images (any form — upload or URL)
- Recipe web scraper / import
- Meal planning (standard or flexible structure)
- Grocery list generation
- Bulk cooking mode
- Nutrition info, pricing
- Any public/portfolio deployment or demo mode
- Multi-user auth (household access is via trusted local dev only)

## Open Items / Deferred Design Decisions (not blocking this MVP)

- Thumbnail image storage: Vercel Blob was evaluated (Hobby tier: 1GB storage / 10GB transfer per month, free, non-commercial use only) and is the likely answer whenever images come back in scope.
- Turso free tier confirmed sufficient for both a future demo DB and the personal DB: 100 databases, 5GB total storage, 500M row reads/month, 10M row writes/month, no credit card required.
- Demo-mode client-side filtering (merging server-seeded data with a visitor's localStorage overlay) is designed at a high level (see Architecture section) but not implemented.
