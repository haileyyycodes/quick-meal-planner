'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { RECIPE_QUERY } from '@/src/lib/graphql/documents';
import type { Recipe } from '@/src/lib/graphql/types';
import { DraftBadge } from '@/src/components/ui/DraftBadge';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import { RecipeCard } from '@/src/components/RecipeCard';
import styles from './page.module.css';

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const recipeId = Number(id);

  const { data, loading, error, refetch } = useQuery<{ recipe: Recipe | null }>(RECIPE_QUERY, {
    variables: { id: recipeId },
  });

  if (loading) {
    return (
      <main>
        <SkeletonList rows={4} />
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <ErrorState message="We couldn't load this recipe. Check your connection and try again." onRetry={() => refetch()} />
      </main>
    );
  }

  const recipe = data?.recipe;

  if (!recipe) {
    return (
      <main>
        <EmptyState
          title="Recipe not found"
          description="It may have been deleted."
          action={
            <Link href="/" className={styles.backLink}>
              ← Back to recipes
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main>
      {recipe.draft && (
        <div className={styles.toolbar}>
          <DraftBadge />
        </div>
      )}

      {recipe.originalRecipeLink && (
        <p className={styles.originalLink}>
          <a href={recipe.originalRecipeLink} target="_blank" rel="noreferrer noopener">
            Original recipe ↗
          </a>
        </p>
      )}

      <RecipeCard recipe={recipe} />
    </main>
  );
}
