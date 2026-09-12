'use client';

import { useId } from 'react';
import { ComboBoxInput } from '@/src/components/ComboBoxInput';
import { INGREDIENTS_QUERY } from '@/src/lib/graphql/documents';
import { UNITS } from '@/src/lib/constants';
import { Button } from '@/src/components/ui/Button';
import inputStyles from '@/src/components/ui/inputs.module.css';
import { emptyIngredientRow, IngredientRowState } from './types';
import styles from './RecipeForm.module.css';

type IngredientRowsProps = {
  value: IngredientRowState[];
  onChange: (rows: IngredientRowState[]) => void;
};

export function IngredientRows({ value, onChange }: IngredientRowsProps) {
  const updateRow = (index: number, patch: Partial<IngredientRowState>) => {
    onChange(value.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, rowIndex) => rowIndex !== index));
  };

  const addRow = () => {
    onChange([...value, emptyIngredientRow()]);
  };

  return (
    <div className={styles.rowGroup}>
      {value.length === 0 && <p className={styles.emptyHint}>No ingredients yet.</p>}
      <ul className={styles.rowList}>
        {value.map((row, index) => (
          <IngredientRowFields
            key={row.key}
            row={row}
            onUpdate={(patch) => updateRow(index, patch)}
            onRemove={() => removeRow(index)}
          />
        ))}
      </ul>
      <Button type="button" variant="secondary" onClick={addRow}>
        + Add ingredient
      </Button>
    </div>
  );
}

function IngredientRowFields({
  row,
  onUpdate,
  onRemove,
}: {
  row: IngredientRowState;
  onUpdate: (patch: Partial<IngredientRowState>) => void;
  onRemove: () => void;
}) {
  const uid = useId();

  return (
    <li className={styles.ingredientRow}>
      <div className={styles.ingredientRowGrid}>
        <label className={styles.srOnlyLabel} htmlFor={`${uid}-name`}>
          Ingredient name
        </label>
        <ComboBoxInput
          id={`${uid}-name`}
          value={row.ingredient}
          onChange={(newValue) => onUpdate({ ingredient: newValue })}
          query={INGREDIENTS_QUERY}
          dataKey="ingredients"
          placeholder="Ingredient (e.g. Flour)"
        />

        <label className={styles.srOnlyLabel} htmlFor={`${uid}-qty`}>
          Quantity
        </label>
        <input
          id={`${uid}-qty`}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          className={inputStyles.input}
          value={row.quantity}
          onChange={(event) => onUpdate({ quantity: event.target.value })}
          placeholder="Qty"
        />

        <label className={styles.srOnlyLabel} htmlFor={`${uid}-unit`}>
          Unit
        </label>
        <select
          id={`${uid}-unit`}
          className={inputStyles.select}
          value={row.unit}
          onChange={(event) => onUpdate({ unit: event.target.value })}
        >
          {UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>

        <label className={styles.srOnlyLabel} htmlFor={`${uid}-prep`}>
          Prep note
        </label>
        <input
          id={`${uid}-prep`}
          type="text"
          className={inputStyles.input}
          value={row.prepNote}
          onChange={(event) => onUpdate({ prepNote: event.target.value })}
          placeholder="Prep note (e.g. diced)"
        />
      </div>
      <Button type="button" variant="ghost" onClick={onRemove} aria-label={`Remove ${row.ingredient || 'ingredient'} row`}>
        Remove
      </Button>
    </li>
  );
}
