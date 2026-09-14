'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { DELETE_RECIPE_MUTATION, RECIPE_QUERY } from '@/src/lib/graphql/documents';
import type { Recipe } from '@/src/lib/graphql/types';
import { sanitizeRichText } from '@/src/lib/sanitizeHtml';
import { DraftBadge } from '@/src/components/ui/DraftBadge';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonList } from '@/src/components/ui/Skeleton';
import { Tag } from '@/src/components/ui/Tag';
import styles from './page.module.css';

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const recipeId = Number(id);
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ recipe: Recipe | null }>(RECIPE_QUERY, {
    variables: { id: recipeId },
  });

  const [deleteRecipe, { loading: deleting }] = useMutation(DELETE_RECIPE_MUTATION, {
    variables: { id: recipeId },
    refetchQueries: ['Recipes'],
  });

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteRecipe();
      router.push('/');
    } catch (mutationError) {
      setDeleteError(mutationError instanceof Error ? mutationError.message : 'Could not delete this recipe.');
    }
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
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h1>{recipe.name}</h1>
            {recipe.draft && <DraftBadge />}
          </div>
          <div className={styles.meta}>
            {recipe.category && <span>{recipe.category}</span>}
            {recipe.cuisine && <span>{recipe.cuisine.name}</span>}
            {recipe.servings != null && <span>Serves {recipe.servings}</span>}
            {recipe.yieldLabel && <span>{recipe.yieldLabel}</span>}
          </div>
          <div className={styles.meta}>
            {recipe.totalTime != null && <span>Total: {recipe.totalTime} min</span>}
            {recipe.activeTime != null && <span>Active: {recipe.activeTime} min</span>}
            {recipe.restTime != null && <span>Rest: {recipe.restTime} min</span>}
          </div>
          {recipe.tags.length > 0 && (
            <ul className={styles.tagList} aria-label="Tags">
              {recipe.tags.map((tag) => (
                <li key={tag.id}>
                  <Tag>{tag.name}</Tag>
                </li>
              ))}
            </ul>
          )}
          {recipe.originalRecipeLink && (
            <p>
              <a href={recipe.originalRecipeLink} target="_blank" rel="noreferrer noopener">
                Original recipe ↗
              </a>
            </p>
          )}
        </div>
        <div className={styles.headerActions}>
          <Link href={`/recipes/${recipe.id}/edit`} className={styles.editLink}>
            Edit
          </Link>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {deleteError && (
        <p role="alert" className={styles.deleteError}>
          {deleteError}
        </p>
      )}

      <section className={styles.section}>
        <h2>Ingredients</h2>
        {recipe.ingredients.length === 0 ? (
          <p className={styles.emptyHint}>No ingredients added yet.</p>
        ) : (
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((item) => (
              <li key={item.id}>
                {item.quantity != null && <span>{item.quantity} </span>}
                <span>{item.unit !== 'each' ? `${item.unit} ` : ''}</span>
                <span>{item.ingredient.name}</span>
                {item.prepNote && <span className={styles.prepNote}> ({item.prepNote})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2>Steps</h2>
        {recipe.steps.length === 0 ? (
          <p className={styles.emptyHint}>No steps added yet.</p>
        ) : (
          <ol className={styles.stepList}>
            {recipe.steps
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <li key={step.id} dangerouslySetInnerHTML={{ __html: sanitizeRichText(step.text) }} />
              ))}
          </ol>
        )}
      </section>

      {recipe.notes && (
        <section className={styles.section}>
          <h2>Notes</h2>
          <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(recipe.notes) }} />
        </section>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${recipe.name}"?`}
        description="This permanently removes the recipe, its ingredients, and its steps. This can't be undone."
        confirmLabel="Delete recipe"
        danger
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}
