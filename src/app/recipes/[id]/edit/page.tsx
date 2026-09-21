'use client';

import { use, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { RECIPE_QUERY, UPDATE_RECIPE_MUTATION } from '@/src/lib/graphql/documents';
import type { Recipe, RecipeInput } from '@/src/lib/graphql/types';
import { EditRecipeCard } from '@/src/components/EditRecipeCard';
import { useNavigationGuard } from '@/src/components/NavigationGuard';
import { useRecipeMetadata } from '@/src/components/RecipeMetadataContext';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import styles from './page.module.css';

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const recipeId = Number(id);
  const router = useRouter();
  const { consumePendingHref } = useNavigationGuard();
  const metadata = useRecipeMetadata();

  const { data, loading, error, refetch } = useQuery<{ recipe: Recipe | null }>(RECIPE_QUERY, {
    variables: { id: recipeId },
  });

  const recipe = data?.recipe;

  // Populate the shared metadata fields (rendered in the settings panel) once per recipe,
  // not on every background refetch — that would clobber in-progress edits. Runs as a layout
  // effect (before paint) so the panel never flashes empty fields before they're filled in.
  useLayoutEffect(() => {
    if (recipe) metadata.reset(recipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id]);

  const [updateRecipe] = useMutation(UPDATE_RECIPE_MUTATION, {
    refetchQueries: ['Recipes'],
  });

  const handleSubmit = async (input: RecipeInput) => {
    await updateRecipe({ variables: { id: recipeId, input } });
    router.push(consumePendingHref() ?? `/recipes/${recipeId}`);
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
      <EditRecipeCard initialRecipe={recipe} onSubmit={handleSubmit} />
    </main>
  );
}
