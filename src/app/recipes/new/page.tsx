'use client';

import { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { CREATE_RECIPE_MUTATION } from '@/src/lib/graphql/documents';
import type { RecipeInput } from '@/src/lib/graphql/types';
import { EditRecipeCard } from '@/src/components/EditRecipeCard';
import { useNavigationGuard } from '@/src/components/NavigationGuard';
import { useRecipeMetadata } from '@/src/components/RecipeMetadataContext';

export default function NewRecipePage() {
  const router = useRouter();
  const { consumePendingHref } = useNavigationGuard();
  const metadata = useRecipeMetadata();

  // Start from a blank slate every time this page is landed on, even if the metadata context
  // still holds a previously-edited recipe's fields.
  useLayoutEffect(() => {
    metadata.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [createRecipe] = useMutation<{ createRecipe: { id: number } }>(CREATE_RECIPE_MUTATION, {
    refetchQueries: ['Recipes'],
  });

  const handleSubmit = async (input: RecipeInput) => {
    const result = await createRecipe({ variables: { input } });
    const newId = result.data?.createRecipe.id;
    router.push(consumePendingHref() ?? (newId ? `/recipes/${newId}` : '/'));
  };

  return (
    <main>
      <EditRecipeCard onSubmit={handleSubmit} />
    </main>
  );
}
