# Digital Cookbook — MVP Implementation Plan

Companion to [MVP_SPEC.md](./MVP_SPEC.md). Each step is tagged:

- 🧑 **YOU DO THIS** — a manual action outside of code (account creation, CLI commands, copying credentials). Nobody can script this for you; it requires you to actually click/type it yourself.
- 💻 **BUILD** — code that gets written in a dev session, no manual account/credential work involved.

Database hookup is entirely in Phase 1 and 2 — read those closely, everything after assumes the database already exists and is reachable.

---

## Phase 0: Prerequisites

🧑 **YOU DO THIS**
- Confirm Node.js is installed on both your machine and your husband's (`node -v` — 20.x or later). Install from [nodejs.org](https://nodejs.org) if missing, on whichever machine(s) need it.
- Decide the GitHub repo's visibility (public/private) — this repo already exists at `digital-cookbok` locally; confirm whether it's pushed to GitHub yet and as what visibility, since a public repo would expose your Turso credentials if they ever accidentally get committed (they won't, per Phase 1's `.gitignore` step, but worth deciding up front).

---

## Phase 1: Create the Turso database

This is the actual "hooking up the database" work. All of it happens outside the codebase, in your terminal or Turso's dashboard, before any app code can talk to it.

🧑 **YOU DO THIS**
1. **Sign up for Turso** at [turso.tech](https://turso.tech) — no credit card required for the free tier.
2. **Install the Turso CLI:**
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
   (or `brew install tursodatabase/tap/turso` on macOS with Homebrew)
3. **Authenticate the CLI:**
   ```bash
   turso auth login
   ```
   This opens a browser to link the CLI to your Turso account.
4. **Create the personal database:**
   ```bash
   turso db create digital-cookbook-personal
   ```
5. **Get the database URL:**
   ```bash
   turso db show digital-cookbook-personal --url
   ```
   Save this — it's the `TURSO_DATABASE_URL` value.
6. **Create an auth token for your machine:**
   ```bash
   turso db tokens create digital-cookbook-personal
   ```
   Save this — it's your `TURSO_AUTH_TOKEN`. Treat it like a password.
7. **Create a second, separate auth token for your husband's machine** (same command, run again — Turso lets you mint multiple tokens per database). Using two distinct tokens rather than sharing one means either can be revoked independently later (e.g., if a laptop is lost) without cutting off the other person.

**Decision to make here:** Turso tokens can be minted with an expiration or as long-lived. For a 2-person local-dev-only app, I'd recommend a **long-lived token** (no `--expiration` flag) to avoid re-authenticating every few weeks — the security tradeoff is acceptable since these tokens only ever live in a local `.env.local` file on trusted machines, never in a public deployment. Flag if you'd rather set an expiration and re-mint periodically.

---

## Phase 2: Wire the app to the database

🧑 **YOU DO THIS**
- Create `.env.local` in the repo root (on **each** machine — yours and your husband's, each with their own token from Phase 1):
  ```
  TURSO_DATABASE_URL=libsql://digital-cookbook-personal-<your-org>.turso.io
  TURSO_AUTH_TOKEN=<the token for this machine>
  ```
- Confirm `.env.local` is listed in `.gitignore` before your first commit (💻 will scaffold `.gitignore` with this already in place — just double-check it's actually there once the file exists, since committing a token is the one mistake here that actually matters).

💻 **BUILD**
- Scaffold the Next.js app (TypeScript) with `.gitignore` including `.env.local`
- Install `@libsql/client` and connect it to `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`
- Write the SQL schema migration (tables: `recipes`, `steps`, `ingredients`, `recipe_ingredients`, `tags`, `recipe_tags`, `cuisines`, plus a seeded `units` reference table per the fixed enum in the spec)
- Add a small script (`npm run db:migrate`) that applies the schema to whatever `TURSO_DATABASE_URL` is currently set — 🧑 **you run this once** after Phase 1/2 setup to create the tables, and again any time a schema change ships
- Verify the connection with a trivial smoke-test query (e.g., a script that connects and runs `SELECT 1`) before building anything on top of it

**Checkpoint:** by the end of Phase 2, you should be able to run the migration script against your real Turso DB and see the tables exist (`turso db shell digital-cookbook-personal` → `.tables` confirms this). Nothing else in the app depends on manual setup after this point — Phases 3+ are pure code.

---

## Phase 3: GraphQL layer (Apollo Server)

💻 **BUILD**
- Define the GraphQL schema matching the data model in `MVP_SPEC.md` (Recipe, Step, Ingredient, RecipeIngredient, Tag, Cuisine, Category enum, Unit enum)
- Stand up Apollo Server inside a Next.js API route (e.g. `/api/graphql`)
- Write resolvers backed by `@libsql/client` queries — this is where filtering (name, ingredient, cuisine, tags, category, bucketed total-time) gets implemented as real SQL, not client-side filtering, per the spec's architecture decision
- Write mutations: create/edit/delete recipe, with the "only Name required" validation rule and the on-the-fly ingredient-creation behavior

🧑 **YOU DO THIS**
- None — this phase is entirely code, running against the database you already wired up in Phase 1/2.

---

## Phase 4: Frontend

💻 **BUILD**
- Set up Apollo Client, pointed at `/api/graphql`
- Recipe list view (compact list, not card grid), wired to a real GraphQL query with filter args, showing loading/error states per the "real request UX" goal
- Recipe detail view
- Recipe create/edit form: Name-required validation, structured ingredient rows (creatable ingredient autocomplete, fixed-unit dropdown), reorderable step list with the Tiptap bold/italic/underline editor, same editor reused for Notes
- Draft badge (computed client-side or via a resolver field) wherever Category/Total Time/Ingredients/Steps are missing
- Delete flow with a confirmation step

🧑 **YOU DO THIS**
- Once this phase is running locally on your machine, have your husband pull the repo, add his own `.env.local` (his token from Phase 1), run `npm install && npm run dev`, and confirm he sees the same data you do — this is the actual proof that the "personal, multi-device" architecture decision works, not just a code review.

---

## Explicit summary: what's manual vs. what's built

| Task | Who |
|---|---|
| Turso account signup | 🧑 You |
| Turso CLI install + login | 🧑 You |
| Create the database | 🧑 You |
| Mint auth tokens (one per machine) | 🧑 You |
| Write `.env.local` on each machine | 🧑 You |
| Run the migration script (creates tables) | 🧑 You (script is built for you) |
| Verify husband's machine can reach the same data | 🧑 You (both of you) |
| Everything else (schema code, resolvers, UI, forms) | 💻 Built |

Everything under 💻 can happen in a single build session once Phase 1 is done — the database has to exist and be reachable before any of that code has something real to talk to.
