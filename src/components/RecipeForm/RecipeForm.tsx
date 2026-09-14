'use client';

import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/src/lib/constants';
import type { Recipe, RecipeInput } from '@/src/lib/graphql/types';
import { CUISINES_QUERY } from '@/src/lib/graphql/documents';
import { ComboBoxInput } from '@/src/components/ComboBoxInput';
import { TagsInput } from '@/src/components/TagsInput';
import { RichTextEditor } from '@/src/components/RichTextEditor';
import { Button } from '@/src/components/ui/Button';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { FormField } from '@/src/components/ui/FormField';
import { SectionDivider } from '@/src/components/ui/SectionDivider';
import inputStyles from '@/src/components/ui/inputs.module.css';
import { IngredientRows } from './IngredientRows';
import { StepsEditor } from './StepsEditor';
import { emptyIngredientRow, emptyStepRow, IngredientRowState, StepRowState } from './types';
import styles from './RecipeForm.module.css';

type RecipeFormProps = {
  initialRecipe?: Recipe;
  onSubmit: (input: RecipeInput) => Promise<void>;
  submitLabel: string;
  submitPendingLabel: string;
  cancelHref: string;
};

const toInputRows = (recipe?: Recipe) => {
  const ingredients: IngredientRowState[] = recipe?.ingredients.length
    ? recipe.ingredients.map((item) => ({
        key: `existing-${item.id}`,
        ingredient: item.ingredient.name,
        quantity: item.quantity === null ? '' : String(item.quantity),
        unit: item.unit,
        prepNote: item.prepNote ?? '',
      }))
    : [emptyIngredientRow()];

  const steps: StepRowState[] = recipe?.steps.length
    ? recipe.steps
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((step) => ({ key: `existing-${step.id}`, text: step.text }))
    : [emptyStepRow()];

  return { ingredients, steps };
};

export function RecipeForm({ initialRecipe, onSubmit, submitLabel, submitPendingLabel, cancelHref }: RecipeFormProps) {
  const [initialRows] = useState(() => toInputRows(initialRecipe));

  const [name, setName] = useState(initialRecipe?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [category, setCategory] = useState(initialRecipe?.category ?? '');
  const [cuisine, setCuisine] = useState(initialRecipe?.cuisine?.name ?? '');
  const [servings, setServings] = useState(initialRecipe?.servings != null ? String(initialRecipe.servings) : '');
  const [yieldLabel, setYieldLabel] = useState(initialRecipe?.yieldLabel ?? '');
  const [activeTime, setActiveTime] = useState(initialRecipe?.activeTime != null ? String(initialRecipe.activeTime) : '');
  const [restTime, setRestTime] = useState(initialRecipe?.restTime != null ? String(initialRecipe.restTime) : '');
  const [originalRecipeLink, setOriginalRecipeLink] = useState(initialRecipe?.originalRecipeLink ?? '');
  const [notes, setNotes] = useState(initialRecipe?.notes ?? '');
  const [tags, setTags] = useState<string[]>(initialRecipe?.tags.map((tag) => tag.name) ?? []);
  const [ingredients, setIngredients] = useState<IngredientRowState[]>(initialRows.ingredients);
  const [steps, setSteps] = useState<StepRowState[]>(initialRows.steps);

  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const parseNumber = (raw: string): number | null => {
    if (raw.trim() === '') return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const activeMinutes = parseNumber(activeTime);
  const restMinutes = parseNumber(restTime);
  const totalTime = activeMinutes == null && restMinutes == null ? null : (activeMinutes ?? 0) + (restMinutes ?? 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Recipe name is required.');
      nameInputRef.current?.focus();
      return;
    }
    setNameError(null);
    setSubmitError(null);

    const input: RecipeInput = {
      name: trimmedName,
      category: category ? (category as RecipeInput['category']) : null,
      cuisine: cuisine.trim() || null,
      servings: parseNumber(servings),
      yieldLabel: yieldLabel.trim() || null,
      totalTime,
      activeTime: activeMinutes,
      restTime: restMinutes,
      originalRecipeLink: originalRecipeLink.trim() || null,
      notes: notes && notes !== '<p></p>' ? notes : null,
      tags,
      ingredients: ingredients
        .filter((row) => row.ingredient.trim())
        .map((row) => ({
          ingredient: row.ingredient.trim(),
          quantity: parseNumber(row.quantity),
          unit: row.unit,
          prepNote: row.prepNote.trim() || null,
        })),
      instructions: steps
        .filter((step) => step.text && step.text !== '<p></p>')
        .map((step, index) => ({ order: index, text: step.text })),
    };

    setPending(true);
    try {
      await onSubmit(input);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong saving this recipe.');
      setPending(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {submitError && <ErrorState message={submitError} />}

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Recipe details">
          <FormField fullWidth label="Name" htmlFor="recipe-name" required error={nameError ?? undefined} errorId="recipe-name-error">
            <input
              ref={nameInputRef}
              id="recipe-name"
              type="text"
              className={[inputStyles.input, nameError ? inputStyles.invalid : ''].join(' ')}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError(null);
              }}
              aria-required="true"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'recipe-name-error' : undefined}
            />
          </FormField>

          <FormField fullWidth size="sm" label="Category" htmlFor="recipe-category">
            <select
              id="recipe-category"
              className={[inputStyles.select, inputStyles.sm].join(' ')}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">— None —</option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField fullWidth size="sm" label="Cuisine" htmlFor="recipe-cuisine">
            <ComboBoxInput
              id="recipe-cuisine"
              value={cuisine}
              onChange={setCuisine}
              query={CUISINES_QUERY}
              dataKey="cuisines"
              placeholder="e.g. Mexican"
            />
          </FormField>

          <FormField fullWidth size="sm" label="Tags" htmlFor="recipe-tags">
            <TagsInput id="recipe-tags" value={tags} onChange={setTags} />
          </FormField>

          <SectionDivider label="Time" />

          <FormField size="sm" label="Active time (min)" htmlFor="recipe-active-time">
            <input
              id="recipe-active-time"
              type="number"
              inputMode="numeric"
              min="0"
              className={[inputStyles.input, inputStyles.sm].join(' ')}
              value={activeTime}
              onChange={(event) => setActiveTime(event.target.value)}
            />
          </FormField>
          <FormField size="sm" label="Rest time (min)" htmlFor="recipe-rest-time">
            <input
              id="recipe-rest-time"
              type="number"
              inputMode="numeric"
              min="0"
              className={[inputStyles.input, inputStyles.sm].join(' ')}
              value={restTime}
              onChange={(event) => setRestTime(event.target.value)}
            />
          </FormField>
          <FormField
            fullWidth
            size="sm"
            label="Total time (min)"
            htmlFor="recipe-total-time"
            hint="Active + rest time · drives the time filter"
          >
            <input
              id="recipe-total-time"
              type="text"
              disabled
              className={[inputStyles.input, inputStyles.sm].join(' ')}
              value={totalTime != null ? String(totalTime) : ''}
            />
          </FormField>

          <SectionDivider label="Servings & yield" />

          <FormField size="sm" label="Servings" htmlFor="recipe-servings">
            <input
              id="recipe-servings"
              type="number"
              inputMode="numeric"
              min="0"
              className={[inputStyles.input, inputStyles.sm].join(' ')}
              value={servings}
              onChange={(event) => setServings(event.target.value)}
            />
          </FormField>
          <FormField size="sm" label="Yield label" htmlFor="recipe-yield" hint="e.g. &ldquo;makes 24 cookies&rdquo;">
            <input
              id="recipe-yield"
              type="text"
              className={[inputStyles.input, inputStyles.sm].join(' ')}
              value={yieldLabel}
              onChange={(event) => setYieldLabel(event.target.value)}
            />
          </FormField>

          <FormField fullWidth size="sm" label="Original recipe link" htmlFor="recipe-link">
            <input
              id="recipe-link"
              type="url"
              className={[inputStyles.input, inputStyles.sm].join(' ')}
              value={originalRecipeLink}
              onChange={(event) => setOriginalRecipeLink(event.target.value)}
              placeholder="https://…"
            />
          </FormField>
        </aside>

        <div className={styles.main}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Ingredients</h2>
            <IngredientRows value={ingredients} onChange={setIngredients} />
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Steps</h2>
            <StepsEditor value={steps} onChange={setSteps} />
          </section>

          <section className={styles.section}>
            <FormField label="Notes" htmlFor="recipe-notes">
              <RichTextEditor id="recipe-notes" value={notes} onChange={setNotes} ariaLabel="Notes" placeholder="Any notes…" />
            </FormField>
          </section>

          <div className={styles.formActions}>
            <Link href={cancelHref} className={styles.cancelLink}>
              Cancel
            </Link>
            <Button type="submit" variant="primary" pending={pending} pendingLabel={submitPendingLabel}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
