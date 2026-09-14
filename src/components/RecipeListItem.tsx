'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client/react';
import { DELETE_RECIPE_MUTATION } from '@/src/lib/graphql/documents';
import type { Recipe } from '@/src/lib/graphql/types';
import { DraftBadge } from './ui/DraftBadge';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Tag } from './ui/Tag';
import styles from './RecipeListItem.module.css';

type RecipeListItemProps = {
  recipe: Pick<Recipe, 'id' | 'name' | 'category' | 'totalTime' | 'draft' | 'cuisine' | 'tags'>;
};

export function RecipeListItem({ recipe }: RecipeListItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deleteRecipe, { loading: deleting }] = useMutation(DELETE_RECIPE_MUTATION, {
    variables: { id: recipe.id },
    refetchQueries: ['Recipes'],
  });

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    try {
      await deleteRecipe();
      setConfirmOpen(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete this recipe.');
    }
  };

  return (
    <li className={styles.item}>
      <Link href={`/recipes/${recipe.id}`} className={styles.link}>
        <div className={styles.primary}>
          <span className={styles.name}>{recipe.name}</span>
          {recipe.draft && <DraftBadge />}
        </div>
        <div className={styles.meta}>
          {recipe.category && <span>{recipe.category}</span>}
          {recipe.cuisine && <span>{recipe.cuisine.name}</span>}
          {recipe.totalTime != null && <span>{recipe.totalTime} min</span>}
        </div>
        {recipe.tags.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.map((tag) => (
              <Tag key={tag.id}>{tag.name}</Tag>
            ))}
          </div>
        )}
      </Link>
      <div className={styles.actions}>
        <Link href={`/recipes/${recipe.id}/edit`} className={styles.editLink}>
          Edit
        </Link>
        <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </div>

      {deleteError && (
        <p role="alert" className={styles.deleteError}>
          {deleteError}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${recipe.name}"?`}
        description="This permanently removes the recipe, its ingredients, and its steps. This can't be undone."
        confirmLabel="Delete recipe"
        danger
        pending={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </li>
  );
}
