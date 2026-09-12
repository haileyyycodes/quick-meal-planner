'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { CREATE_RECIPE_MUTATION } from '@/src/lib/graphql/documents';
import type { RecipeInput } from '@/src/lib/graphql/types';
import { RecipeForm } from '@/src/components/RecipeForm/RecipeForm';

export default function NewRecipePage() {
  const router = useRouter();
  const [createRecipe] = useMutation<{ createRecipe: { id: number } }>(CREATE_RECIPE_MUTATION, {
    refetchQueries: ['Recipes'],
  });

  const handleSubmit = async (input: RecipeInput) => {
    const result = await createRecipe({ variables: { input } });
    const newId = result.data?.createRecipe.id;
    if (newId) {
      router.push(`/recipes/${newId}`);
    } else {
      router.push('/');
    }
  };

  return (
    <main>
      <h1>New recipe</h1>
      <RecipeForm onSubmit={handleSubmit} submitLabel="Create recipe" submitPendingLabel="Creating…" cancelHref="/" />
    </main>
  );
}
