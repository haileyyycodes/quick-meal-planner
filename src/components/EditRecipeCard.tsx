'use client';

import { FormEvent, useState } from 'react';
import type { Recipe, RecipeInput } from '@/src/lib/graphql/types';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { ErrorState } from '@/src/components/ui/ErrorState';
import inputStyles from '@/src/components/ui/inputs.module.css';
import { pluralizeUnit } from '@/src/lib/constants';
import { useRecipeMetadata } from './RecipeMetadataContext';
import { IngredientRows } from './RecipeForm/IngredientRows';
import { emptyIngredientRow, IngredientRowState } from './RecipeForm/types';
import { computeTotalTime, metadataToInput } from './RecipeForm/metadata';
import cardStyles from './RecipeCard.module.css';

export const RECIPE_FORM_ID = 'recipe-form';

type EditRecipeCardProps = {
  /** Omit to render a blank card for creating a new recipe. */
  initialRecipe?: Recipe;
  onSubmit: (input: RecipeInput) => Promise<void>;
};

const toInputRows = (recipe?: Recipe) => {
  const ingredients: IngredientRowState[] = recipe?.ingredients.length
    ? recipe.ingredients.map((item) => ({
        key: `existing-${item.id}`,
        ingredient: item.ingredient.name,
        quantity: item.quantity === null ? '' : String(item.quantity),
        unit: item.unit,
        sizeQuantity: item.sizeQuantity === null ? '' : String(item.sizeQuantity),
        sizeUnit: item.sizeUnit ?? '',
        prepNote: item.prepNote ?? '',
      }))
    : [emptyIngredientRow()];

  return { ingredients };
};

export function EditRecipeCard({ initialRecipe, onSubmit }: EditRecipeCardProps) {
  const metadata = useRecipeMetadata();
  const { value } = metadata;

  const [initialRows] = useState(() => toInputRows(initialRecipe));
  const [description, setDescription] = useState(initialRecipe?.description ?? '');
  const [instructions, setInstructions] = useState(initialRecipe?.instructions ?? '');
  const [notes, setNotes] = useState(initialRecipe?.notes ?? '');
  const [ingredients, setIngredients] = useState<IngredientRowState[]>(initialRows.ingredients);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalTime = computeTotalTime(value.activeTime, value.restTime);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!metadata.validateName()) return;
    setSubmitError(null);

    const input: RecipeInput = {
      ...metadataToInput(value),
      description: description.trim() || null,
      instructions: instructions && instructions !== '<p></p>' ? instructions : null,
      notes: notes && notes !== '<p></p>' ? notes : null,
      ingredients: ingredients
        .filter((row) => row.ingredient.trim())
        .map((row) => ({
          ingredient: row.ingredient.trim(),
          quantity: row.quantity.trim() === '' ? null : Number(row.quantity),
          unit: row.unit,
          sizeQuantity: row.sizeQuantity.trim() === '' ? null : Number(row.sizeQuantity),
          sizeUnit: row.sizeUnit.trim() || null,
          prepNote: row.prepNote.trim() || null,
        })),
    };

    try {
      await onSubmit(input);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong saving this recipe.');
    }
  };

  return (
    <form id={RECIPE_FORM_ID} className={cardStyles.card} onSubmit={handleSubmit} noValidate>
      {submitError && <ErrorState message={submitError} />}

      {value.category && <p className={cardStyles.category}>{value.category}</p>}

      <div className={cardStyles.titleRow}>
        <h1 className={cardStyles.title}>{value.name || 'Untitled recipe'}</h1>
        {value.tags.map((tag) => (
          <span key={tag} className={cardStyles.tagPill}>
            {tag}
          </span>
        ))}
      </div>

      {value.servings.trim() && <p className={cardStyles.servings}>{value.servings} Servings</p>}

      {(totalTime != null || value.activeTime.trim() || value.restTime.trim()) && (
        <p className={cardStyles.timeLine}>
          {totalTime != null && (
            <span>
              <strong>Total time:</strong> {totalTime} minutes
            </span>
          )}
          {value.activeTime.trim() && (
            <span>
              <strong>Active time:</strong> {value.activeTime} minutes
            </span>
          )}
          {value.restTime.trim() && (
            <span>
              <strong>Rest time:</strong> {value.restTime} minutes
            </span>
          )}
        </p>
      )}

      {value.cuisine.trim() && <span className={cardStyles.cuisinePill}>{value.cuisine}</span>}

      <textarea
        className={[inputStyles.textarea, cardStyles.description].join(' ')}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Add a short description…"
        aria-label="Description"
        style={{ minHeight: '150px' }}
      />

      <h2 className={cardStyles.sectionHeading}>Ingredients</h2>
      <IngredientRows value={ingredients} onChange={setIngredients} />

      <h2 className={cardStyles.sectionHeading}>Instructions</h2>
      <RichTextEditor
        id="recipe-instructions"
        value={instructions}
        onChange={setInstructions}
        ariaLabel="Instructions"
        placeholder="Describe how to make this recipe…"
        minHeight={600}
      />

      <h2 className={cardStyles.sectionHeading}>Notes</h2>
      <RichTextEditor
        id="recipe-notes"
        value={notes}
        onChange={setNotes}
        ariaLabel="Notes"
        placeholder="Any notes…"
        minHeight={300}
      />

      {value.yieldQuantity.trim() && (
        <p className={cardStyles.yieldLine}>
          Yields {value.yieldQuantity}
          {value.yieldUnit ? ` ${pluralizeUnit(value.yieldUnit, Number(value.yieldQuantity))}` : ''}
        </p>
      )}
    </form>
  );
}
