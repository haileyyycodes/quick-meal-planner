'use client';

import { RefObject } from 'react';
import { CATEGORIES, UNITS } from '@/src/lib/constants';
import { CUISINES_QUERY } from '@/src/lib/graphql/documents';
import { ComboBoxInput } from '@/src/components/ComboBoxInput';
import { TagsInput } from '@/src/components/TagsInput';
import { FormField } from '@/src/components/ui/FormField';
import { Select } from '@/src/components/ui/Select';
import { SectionDivider } from '@/src/components/ui/SectionDivider';
import inputStyles from '@/src/components/ui/inputs.module.css';
import { computeTotalTime, RecipeMetadataState } from './metadata';
import styles from './RecipeForm.module.css';

type RecipeMetadataFieldsProps = {
  value: RecipeMetadataState;
  onChange: (patch: Partial<RecipeMetadataState>) => void;
  nameError?: string | null;
  nameInputRef?: RefObject<HTMLInputElement | null>;
};

export function RecipeMetadataFields({ value, onChange, nameError, nameInputRef }: RecipeMetadataFieldsProps) {
  const totalTime = computeTotalTime(value.activeTime, value.restTime);

  return (
    <>
      <FormField fullWidth label="Name" htmlFor="recipe-name" required error={nameError ?? undefined} errorId="recipe-name-error">
        <input
          ref={nameInputRef}
          id="recipe-name"
          type="text"
          className={[inputStyles.input, nameError ? inputStyles.invalid : ''].join(' ')}
          value={value.name}
          onChange={(event) => onChange({ name: event.target.value })}
          aria-required="true"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'recipe-name-error' : undefined}
        />
      </FormField>

      <FormField fullWidth size="sm" label="Category" htmlFor="recipe-category">
        <Select
          id="recipe-category"
          size="sm"
          value={value.category}
          onChange={(category) => onChange({ category })}
          options={[{ value: '', label: '— None —' }, ...CATEGORIES.map((option) => ({ value: option, label: option }))]}
        />
      </FormField>

      <FormField fullWidth size="sm" label="Cuisine" htmlFor="recipe-cuisine">
        <ComboBoxInput
          id="recipe-cuisine"
          value={value.cuisine}
          onChange={(cuisine) => onChange({ cuisine })}
          query={CUISINES_QUERY}
          dataKey="cuisines"
          placeholder="e.g. Mexican"
        />
      </FormField>

      <FormField fullWidth size="sm" label="Tags" htmlFor="recipe-tags">
        <TagsInput id="recipe-tags" value={value.tags} onChange={(tags) => onChange({ tags })} />
      </FormField>

      <SectionDivider label="Time" />

      <FormField size="sm" label="Active time (min)" htmlFor="recipe-active-time">
        <input
          id="recipe-active-time"
          type="number"
          inputMode="numeric"
          min="0"
          className={[inputStyles.input, inputStyles.sm].join(' ')}
          value={value.activeTime}
          onChange={(event) => onChange({ activeTime: event.target.value })}
        />
      </FormField>
      <FormField size="sm" label="Rest time (min)" htmlFor="recipe-rest-time">
        <input
          id="recipe-rest-time"
          type="number"
          inputMode="numeric"
          min="0"
          className={[inputStyles.input, inputStyles.sm].join(' ')}
          value={value.restTime}
          onChange={(event) => onChange({ restTime: event.target.value })}
        />
      </FormField>
      <FormField fullWidth size="sm" label="Total time (min)" htmlFor="recipe-total-time">
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
          value={value.servings}
          onChange={(event) => onChange({ servings: event.target.value })}
        />
      </FormField>
      <FormField fullWidth size="sm" label="Yield" htmlFor="recipe-yield-quantity">
        <div className={styles.yieldRow}>
          <input
            id="recipe-yield-quantity"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            className={[inputStyles.input, inputStyles.sm].join(' ')}
            value={value.yieldQuantity}
            onChange={(event) => onChange({ yieldQuantity: event.target.value })}
            placeholder="Qty"
          />
          <label className={styles.srOnlyLabel} htmlFor="recipe-yield-unit">
            Yield unit
          </label>
          <Select
            id="recipe-yield-unit"
            size="sm"
            value={value.yieldUnit}
            onChange={(yieldUnit) => onChange({ yieldUnit })}
            options={[{ value: '', label: '— None —' }, ...UNITS]}
          />
        </div>
      </FormField>

      <FormField fullWidth size="sm" label="Original recipe link" htmlFor="recipe-link">
        <input
          id="recipe-link"
          type="url"
          className={[inputStyles.input, inputStyles.sm].join(' ')}
          value={value.originalRecipeLink}
          onChange={(event) => onChange({ originalRecipeLink: event.target.value })}
          placeholder="https://…"
        />
      </FormField>
    </>
  );
}
