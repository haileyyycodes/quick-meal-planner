'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  CaretCircleDown,
  Copy,
  FloppyDisk,
  Notebook,
  PencilSimple,
  Plus,
  Printer,
  Trash,
  X,
} from '@phosphor-icons/react';
import { CREATE_RECIPE_MUTATION, DELETE_RECIPE_MUTATION, RECIPE_QUERY } from '@/src/lib/graphql/documents';
import type { Recipe, RecipeInput } from '@/src/lib/graphql/types';
import { RECIPE_FORM_ID } from './EditRecipeCard';
import { useNavigationGuard } from './NavigationGuard';
import { ConfirmDialog } from './ui/ConfirmDialog';
import styles from './IconRail.module.css';

const RECIPE_VIEW_PATTERN = /^\/recipes\/(\d+)$/;
const RECIPE_EDIT_PATTERN = /^\/recipes\/(\d+)\/edit$/;

export function IconRail() {
  const pathname = usePathname();
  const { isFormActive, guardedNavigate } = useNavigationGuard();
  const isRecipesActive = pathname === '/' || pathname.startsWith('/recipes');
  const viewRecipeId = pathname.match(RECIPE_VIEW_PATTERN)?.[1] ?? null;
  const editRecipeId = pathname.match(RECIPE_EDIT_PATTERN)?.[1] ?? null;
  const isNew = pathname === '/recipes/new';

  return (
    <div className={styles.rail}>
      <Link
        href="/"
        className={styles.iconButton}
        data-tooltip="Recipes"
        aria-current={isRecipesActive ? 'page' : undefined}
        onClick={(event) => {
          if (isFormActive) {
            event.preventDefault();
            guardedNavigate('/');
          }
        }}
      >
        <Notebook size={22} aria-hidden="true" />
        <span className={styles.srOnly}>Recipes</span>
      </Link>

      <div className={styles.actionsIndicator} aria-hidden="true">
        <CaretCircleDown size={16} />
      </div>
      <span className={styles.srOnly}>Actions for this page</span>

      {editRecipeId ? (
        <RecipeFormActions cancelHref={`/recipes/${editRecipeId}`} />
      ) : isNew ? (
        <RecipeFormActions cancelHref="/" />
      ) : viewRecipeId ? (
        <RecipeViewActions recipeId={viewRecipeId} />
      ) : (
        <Link href="/recipes/new" className={styles.iconButton} data-tooltip="New recipe">
          <Plus size={22} aria-hidden="true" />
          <span className={styles.srOnly}>New recipe</span>
        </Link>
      )}
    </div>
  );
}

function RecipeFormActions({ cancelHref }: { cancelHref: string }) {
  const { guardedNavigate } = useNavigationGuard();

  return (
    <>
      <button
        type="button"
        className={styles.iconButton}
        data-tooltip="Save recipe"
        onClick={() => {
          const form = document.getElementById(RECIPE_FORM_ID);
          if (form instanceof HTMLFormElement) form.requestSubmit();
        }}
      >
        <FloppyDisk size={22} aria-hidden="true" />
        <span className={styles.srOnly}>Save recipe</span>
      </button>

      <Link
        href={cancelHref}
        className={styles.iconButton}
        data-tooltip="Cancel"
        onClick={(event) => {
          event.preventDefault();
          guardedNavigate(cancelHref);
        }}
      >
        <X size={22} aria-hidden="true" />
        <span className={styles.srOnly}>Cancel</span>
      </Link>
    </>
  );
}

function toDuplicateInput(recipe: Recipe): RecipeInput {
  return {
    name: `${recipe.name} (Copy)`,
    description: recipe.description,
    category: recipe.category,
    cuisine: recipe.cuisine?.name ?? null,
    servings: recipe.servings,
    yieldQuantity: recipe.yieldQuantity,
    yieldUnit: recipe.yieldUnit,
    totalTime: recipe.totalTime,
    activeTime: recipe.activeTime,
    restTime: recipe.restTime,
    originalRecipeLink: recipe.originalRecipeLink,
    instructions: recipe.instructions,
    notes: recipe.notes,
    ingredients: recipe.ingredients.map((item) => ({
      ingredient: item.ingredient.name,
      quantity: item.quantity,
      unit: item.unit,
      sizeQuantity: item.sizeQuantity,
      sizeUnit: item.sizeUnit,
      prepNote: item.prepNote,
    })),
    tags: recipe.tags.map((tag) => tag.name),
  };
}

function RecipeViewActions({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const numericId = Number(recipeId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data } = useQuery<{ recipe: Recipe | null }>(RECIPE_QUERY, { variables: { id: numericId } });
  const recipe = data?.recipe;

  const [deleteRecipe, { loading: deleting }] = useMutation(DELETE_RECIPE_MUTATION, {
    variables: { id: numericId },
    refetchQueries: ['Recipes'],
  });

  const [createRecipe, { loading: duplicating }] = useMutation<{ createRecipe: { id: number } }>(
    CREATE_RECIPE_MUTATION,
    { refetchQueries: ['Recipes'] }
  );

  const handleDelete = async () => {
    try {
      await deleteRecipe();
      setConfirmOpen(false);
      router.push('/');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete this recipe.');
    }
  };

  const handleDuplicate = async () => {
    if (!recipe) return;
    try {
      const result = await createRecipe({ variables: { input: toDuplicateInput(recipe) } });
      const newId = result.data?.createRecipe.id;
      if (newId) router.push(`/recipes/${newId}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not duplicate this recipe.');
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.iconButton}
        data-tooltip="Duplicate recipe"
        disabled={!recipe || duplicating}
        onClick={handleDuplicate}
      >
        <Copy size={22} aria-hidden="true" />
        <span className={styles.srOnly}>Duplicate recipe</span>
      </button>

      <Link href={`/recipes/${recipeId}/edit`} className={styles.iconButton} data-tooltip="Edit recipe">
        <PencilSimple size={22} aria-hidden="true" />
        <span className={styles.srOnly}>Edit recipe</span>
      </Link>

      <button
        type="button"
        className={styles.iconButton}
        data-tooltip="Print recipe"
        onClick={() => window.print()}
      >
        <Printer size={22} aria-hidden="true" />
        <span className={styles.srOnly}>Print recipe</span>
      </button>

      <button
        type="button"
        className={styles.iconButton}
        data-tooltip="Delete recipe"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash size={22} aria-hidden="true" />
        <span className={styles.srOnly}>Delete recipe</span>
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${recipe?.name ?? 'this recipe'}"?`}
        description="This permanently removes the recipe, its ingredients, and its steps. This can't be undone."
        confirmLabel="Delete recipe"
        danger
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
