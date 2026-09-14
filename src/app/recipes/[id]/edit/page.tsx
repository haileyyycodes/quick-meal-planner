'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { RECIPE_QUERY, UPDATE_RECIPE_MUTATION } from '@/src/lib/graphql/documents';
import type { Recipe, RecipeInput } from '@/src/lib/graphql/types';
import { RecipeForm } from '@/src/components/RecipeForm/RecipeForm';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import styles from './page.module.css';

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const recipeId = Number(id);
  const router = useRouter();

  const { data, loading, error, refetch } = useQuery<{ recipe: Recipe | null }>(RECIPE_QUERY, {
    variables: { id: recipeId },
  });

  const [updateRecipe] = useMutation(UPDATE_RECIPE_MUTATION, {
    refetchQueries: ['Recipes'],
  });

  const handleSubmit = async (input: RecipeInput) => {
    await updateRecipe({ variables: { id: recipeId, input } });
    router.push(`/recipes/${recipeId}`);
  };

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
      <h1>Edit recipe</h1>
      <RecipeForm
        initialRecipe={recipe}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        submitPendingLabel="Saving…"
        cancelHref={`/recipes/${recipeId}`}
      />
    </main>
  );
}
