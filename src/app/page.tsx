'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { RECIPES_QUERY } from '@/src/lib/graphql/documents';
import type { Recipe, RecipeFilterInput } from '@/src/lib/graphql/types';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import { EMPTY_FILTERS, FiltersState, hasActiveFilters, RecipeFilters } from '@/src/components/RecipeFilters';
import { RecipeTable } from '@/src/components/RecipeTable';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Button } from '@/src/components/ui/Button';
import styles from './page.module.css';

function toFilterInput(filters: FiltersState): RecipeFilterInput {
  const input: RecipeFilterInput = {};
  if (filters.name.trim()) input.name = filters.name.trim();
  if (filters.ingredient.trim()) input.ingredient = filters.ingredient.trim();
  if (filters.cuisine.trim()) input.cuisine = filters.cuisine.trim();
  if (filters.tags.length > 0) input.tags = filters.tags;
  if (filters.category) input.category = filters.category as RecipeFilterInput['category'];
  if (filters.timeBucket) input.timeBucket = filters.timeBucket as RecipeFilterInput['timeBucket'];
  return input;
}

export default function RecipeListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const debouncedFilters = useDebouncedValue(filters, 300);
  const filterInput = useMemo(() => toFilterInput(debouncedFilters), [debouncedFilters]);

  const { data, loading, error, refetch } = useQuery<{ recipes: Recipe[] }>(RECIPES_QUERY, {
    variables: { filter: filterInput },
    notifyOnNetworkStatusChange: true,
  });

  const recipes = data?.recipes ?? [];
  const isInitialLoad = loading && !data;
  const isRevalidating = loading && !!data;
  const filtersActive = hasActiveFilters(debouncedFilters);

  return (
    <main>
      <div className={styles.pageHeader}>
        <h1>Recipes</h1>
        {isRevalidating && (
          <span className={styles.updating} role="status">
            Updating…
          </span>
        )}
      </div>

      <RecipeFilters value={filters} onChange={setFilters} />

      {isInitialLoad && <SkeletonList />}

      {error && !isInitialLoad && (
        <ErrorState message="We couldn't load your recipes. Check your connection and try again." onRetry={() => refetch()} />
      )}

      {!isInitialLoad && !error && recipes.length === 0 && (
        <EmptyState
          title={filtersActive ? 'No recipes match those filters.' : 'No recipes yet.'}
          description={
            filtersActive
              ? 'Try clearing a filter or two.'
              : 'Add your first recipe to start building your catalog.'
          }
          action={
            !filtersActive && (
              <Button variant="primary" onClick={() => router.push('/recipes/new')}>
                + New recipe
              </Button>
            )
          }
        />
      )}

      {!isInitialLoad && !error && (
        <p className={styles.srOnly} role="status">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} found
        </p>
      )}

      {!isInitialLoad && !error && recipes.length > 0 && <RecipeTable recipes={recipes} />}
    </main>
  );
}
