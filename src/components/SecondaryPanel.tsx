'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { Funnel, Gear, List, MagnifyingGlass } from '@phosphor-icons/react';
import { RECIPES_QUERY, RECIPE_QUERY } from '@/src/lib/graphql/documents';
import type { Recipe, RecipeFilterInput } from '@/src/lib/graphql/types';
import { pluralizeUnit } from '@/src/lib/constants';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import { EMPTY_FILTERS, FiltersState, hasActiveFilters } from './RecipeFilters';
import { FilterDialog } from './FilterDialog';
import { useNavigationGuard } from './NavigationGuard';
import { RecipeMetadataFields } from './RecipeForm/RecipeMetadataFields';
import { useRecipeMetadata } from './RecipeMetadataContext';
import styles from './SecondaryPanel.module.css';

const RECIPE_CONTEXT_PATTERN = /^\/recipes\/(\d+)(?:\/edit)?$/;

type SecondaryPanelProps = {
  id?: string;
  /** Collapses the panel to reclaim width without unmounting it, so its in-flight queries and
   * list/settings mode survive being hidden and shown again (e.g. in a narrow side-by-side tab). */
  collapsed?: boolean;
};

export function SecondaryPanel({ id, collapsed }: SecondaryPanelProps) {
  const pathname = usePathname();
  const recipeId = pathname.match(RECIPE_CONTEXT_PATTERN)?.[1] ?? null;
  const { isFormActive } = useNavigationGuard();
  const { nameError } = useRecipeMetadata();

  const [mode, setMode] = useState<'list' | 'settings'>(isFormActive ? 'settings' : 'list');

  // Fall back to the list whenever the selected recipe changes (including losing selection).
  const [lastRecipeId, setLastRecipeId] = useState(recipeId);
  if (recipeId !== lastRecipeId) {
    setLastRecipeId(recipeId);
    setMode('list');
  }

  // Jump straight to the editable settings view when entering the create/edit form for the same
  // recipe (recipeId doesn't change between /recipes/[id] and /recipes/[id]/edit, so the effect
  // above won't fire, and /recipes/new has no recipeId to begin with).
  const [lastIsFormActive, setLastIsFormActive] = useState(isFormActive);
  if (isFormActive !== lastIsFormActive) {
    setLastIsFormActive(isFormActive);
    if (isFormActive) setMode('settings');
  }

  // Surface a name-validation error even if the user had switched the panel away from settings.
  const [lastNameError, setLastNameError] = useState(nameError);
  if (nameError !== lastNameError) {
    setLastNameError(nameError);
    if (nameError && isFormActive) setMode('settings');
  }

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const filtersActive = hasActiveFilters(filters);

  const filterInput: RecipeFilterInput = {
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(filters.cuisine.trim() && { cuisine: filters.cuisine.trim() }),
    ...(filters.tags.length > 0 && { tags: filters.tags }),
    ...(filters.category && { category: filters.category as RecipeFilterInput['category'] }),
    ...(filters.timeBucket && { timeBucket: filters.timeBucket as RecipeFilterInput['timeBucket'] }),
  };

  // Keep both queries running for the life of the panel (not gated by `mode`) so toggling
  // between list/settings is an instant local state change, never a refetch/loading flash.
  const recipesQuery = useQuery<{ recipes: Recipe[] }>(RECIPES_QUERY, { variables: { filter: filterInput } });
  const recipeQuery = useQuery<{ recipe: Recipe | null }>(RECIPE_QUERY, {
    variables: { id: Number(recipeId) },
    skip: !recipeId,
  });

  return (
    <div
      id={id}
      className={collapsed ? `${styles.panel} ${styles.collapsed}` : styles.panel}
      aria-hidden={collapsed || undefined}
      inert={collapsed || undefined}
    >
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.iconButton}
          aria-pressed={mode === 'list'}
          data-tooltip="Recipe list"
          onClick={() => setMode('list')}
        >
          <List size={20} aria-hidden="true" />
          <span className={styles.srOnly}>Recipe list</span>
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-pressed={mode === 'settings'}
          disabled={!recipeId && !isFormActive}
          data-tooltip={recipeId || isFormActive ? 'Recipe settings' : 'Select a recipe to see its settings'}
          onClick={() => setMode('settings')}
        >
          <Gear size={20} aria-hidden="true" />
          <span className={styles.srOnly}>Recipe settings</span>
        </button>
      </div>

      {mode === 'list' && (
        <div className={styles.searchRow}>
          <div className={styles.searchField}>
            <MagnifyingGlass size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search recipes by name or ingredient"
            />
          </div>
          <button
            type="button"
            className={styles.filterButton}
            data-tooltip="Filter recipes"
            onClick={() => setFilterDialogOpen(true)}
          >
            <Funnel size={18} aria-hidden="true" />
            {filtersActive && <span className={styles.filterDot} aria-hidden="true" />}
            <span className={styles.srOnly}>Filter recipes{filtersActive ? ' (filters applied)' : ''}</span>
          </button>
        </div>
      )}

      {mode === 'list' ? (
        <RecipeListNav
          selectedRecipeId={recipeId}
          recipes={recipesQuery.data?.recipes ?? []}
          loading={recipesQuery.loading}
          error={Boolean(recipesQuery.error)}
          filtered={Boolean(debouncedSearch.trim()) || filtersActive}
        />
      ) : isFormActive ? (
        <RecipeSettingsEditor />
      ) : (
        <RecipeSettings
          recipe={recipeQuery.data?.recipe ?? null}
          loading={recipeQuery.loading}
          error={Boolean(recipeQuery.error)}
        />
      )}

      <FilterDialog
        open={filterDialogOpen}
        value={filters}
        onApply={(next) => {
          setFilters(next);
          setFilterDialogOpen(false);
        }}
        onCancel={() => setFilterDialogOpen(false)}
      />
    </div>
  );
}

function RecipeListNav({
  selectedRecipeId,
  recipes,
  loading,
  error,
  filtered,
}: {
  selectedRecipeId: string | null;
  recipes: Recipe[];
  loading: boolean;
  error: boolean;
  filtered: boolean;
}) {
  const { isFormActive, guardedNavigate } = useNavigationGuard();

  return (
    <nav aria-label="Recipes" className={styles.list}>
      {loading && recipes.length === 0 && <p className={styles.hint}>Loading…</p>}
      {error && <p className={styles.hint}>Couldn&apos;t load recipes.</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className={styles.hint}>{filtered ? 'No recipes match.' : 'No recipes yet.'}</p>
      )}
      {recipes.map((recipe) => {
        const href = `/recipes/${recipe.id}`;
        return (
          <Link
            key={recipe.id}
            href={href}
            className={styles.listItem}
            aria-current={String(recipe.id) === selectedRecipeId ? 'page' : undefined}
            onClick={(event) => {
              if (isFormActive) {
                event.preventDefault();
                guardedNavigate(href);
              }
            }}
          >
            {recipe.name}
          </Link>
        );
      })}
    </nav>
  );
}

function RecipeSettingsEditor() {
  const metadata = useRecipeMetadata();

  return (
    <div className={styles.settings}>
      <div className={styles.editFields}>
        <RecipeMetadataFields
          value={metadata.value}
          onChange={metadata.onChange}
          nameError={metadata.nameError}
          nameInputRef={metadata.nameInputRef}
        />
      </div>
    </div>
  );
}

function RecipeSettings({
  recipe,
  loading,
  error,
}: {
  recipe: Recipe | null;
  loading: boolean;
  error: boolean;
}) {
  if (loading && !recipe) return <p className={styles.hint}>Loading…</p>;
  if (error) return <p className={styles.hint}>Couldn&apos;t load settings.</p>;
  if (!recipe) return null;

  const hasMetadata = recipe.cuisine || recipe.tags.length > 0;
  const hasTime = recipe.activeTime != null || recipe.restTime != null;
  const hasYield = recipe.servings != null || recipe.yieldQuantity != null;

  return (
    <div className={styles.settings}>
      {hasMetadata && (
        <section className={styles.settingsSection}>
          <h2 className={styles.settingsHeading}>Metadata</h2>
          {recipe.cuisine && (
            <div className={styles.settingsRow}>
              <span>Cuisine</span>
              <span className={styles.chip}>{recipe.cuisine.name}</span>
            </div>
          )}
          {recipe.tags.length > 0 && (
            <div className={styles.settingsRow}>
              <span>Tags</span>
              <span className={styles.chipGroup}>
                {recipe.tags.map((tag) => (
                  <span key={tag.id} className={styles.chip}>
                    {tag.name}
                  </span>
                ))}
              </span>
            </div>
          )}
        </section>
      )}

      {hasTime && (
        <section className={styles.settingsSection}>
          <h2 className={styles.settingsHeading}>Time</h2>
          {recipe.activeTime != null && (
            <div className={styles.settingsRow}>
              <span>Active Time</span>
              <span className={styles.chip}>{recipe.activeTime} minutes</span>
            </div>
          )}
          {recipe.restTime != null && (
            <div className={styles.settingsRow}>
              <span>Rest Time</span>
              <span className={styles.chip}>{recipe.restTime} minutes</span>
            </div>
          )}
        </section>
      )}

      {hasYield && (
        <section className={styles.settingsSection}>
          <h2 className={styles.settingsHeading}>Yield</h2>
          {recipe.servings != null && (
            <div className={styles.settingsRow}>
              <span>Servings</span>
              <span className={styles.settingsValue}>{recipe.servings}</span>
            </div>
          )}
          {recipe.yieldQuantity != null && (
            <div className={styles.settingsRow}>
              <span>Volume</span>
              <span className={styles.chip}>
                {recipe.yieldQuantity}
                {recipe.yieldUnit ? ` ${pluralizeUnit(recipe.yieldUnit, recipe.yieldQuantity)}` : ''}
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
