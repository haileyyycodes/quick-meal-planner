'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client/react';
import { DELETE_RECIPE_MUTATION } from '@/src/lib/graphql/documents';
import type { Recipe } from '@/src/lib/graphql/types';
import { DraftBadge } from './ui/DraftBadge';
import { ConfirmDialog } from './ui/ConfirmDialog';
import styles from './RecipeTable.module.css';

type RecipeRow = Pick<Recipe, 'id' | 'name' | 'category' | 'totalTime' | 'draft' | 'cuisine' | 'tags'>;

type RecipeTableProps = {
  recipes: RecipeRow[];
};

export function RecipeTable({ recipes }: RecipeTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deleteRecipe, { loading: deleting }] = useMutation(DELETE_RECIPE_MUTATION, {
    refetchQueries: ['Recipes'],
  });

  const recipeToDelete = recipes.find((recipe) => recipe.id === pendingDeleteId);

  const handleConfirmDelete = async () => {
    if (pendingDeleteId == null) return;
    setDeleteError(null);
    try {
      await deleteRecipe({ variables: { id: pendingDeleteId } });
      setPendingDeleteId(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete this recipe.');
    }
  };

  return (
    <div className={styles.wrapper}>
      {deleteError && (
        <p role="alert" className={styles.deleteError}>
          {deleteError}
        </p>
      )}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Cuisine</th>
              <th className={`${styles.th} ${styles.thRight}`}>Time</th>
              <th className={styles.th}>Tags</th>
              <th className={`${styles.th} ${styles.thActions}`} aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe) => (
              <tr key={recipe.id} className={styles.row}>
                <td className={styles.td}>
                  <div className={styles.nameCell}>
                    <Link href={`/recipes/${recipe.id}`} className={styles.nameLink}>
                      {recipe.name}
                    </Link>
                    {recipe.draft && <DraftBadge />}
                  </div>
                </td>
                <td className={styles.td}>{recipe.category ?? '—'}</td>
                <td className={styles.td}>{recipe.cuisine?.name ?? '—'}</td>
                <td className={`${styles.td} ${styles.tdRight} ${styles.muted}`}>
                  {recipe.totalTime != null ? `${recipe.totalTime} min` : '—'}
                </td>
                <td className={`${styles.td} ${styles.muted}`}>
                  {recipe.tags.length > 0 ? recipe.tags.map((tag) => tag.name).join(', ') : '—'}
                </td>
                <td className={`${styles.td} ${styles.actionsCell}`}>
                  <Link href={`/recipes/${recipe.id}/edit`} className={styles.actionLink}>
                    Edit
                  </Link>
                  <button type="button" className={styles.deleteAction} onClick={() => setPendingDeleteId(recipe.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title={recipeToDelete ? `Delete "${recipeToDelete.name}"?` : 'Delete recipe?'}
        description="This permanently removes the recipe, its ingredients, and its steps. This can't be undone."
        confirmLabel="Delete recipe"
        danger
        pending={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
