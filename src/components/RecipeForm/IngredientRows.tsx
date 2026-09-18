'use client';

import { useId } from 'react';
import { ComboBoxInput } from '@/src/components/ComboBoxInput';
import { INGREDIENTS_QUERY } from '@/src/lib/graphql/documents';
import { SIZE_UNITS, UNITS, unitHasSize } from '@/src/lib/constants';
import { Button } from '@/src/components/ui/Button';
import { Select } from '@/src/components/ui/Select';
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

  const moveRow = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.length) return;
    const reordered = [...value];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    onChange(reordered);
  };

  const addRow = () => {
    onChange([...value, emptyIngredientRow()]);
  };

  return (
    <div className={styles.rowGroup}>
      {value.length === 0 && <p className={styles.emptyHint}>No ingredients yet.</p>}
      {value.length > 0 && (
        <div className={styles.ingredientRowHeader} aria-hidden="true">
          <div className={styles.ingredientRowHeaderGrid}>
            <span>Qty</span>
            <span>Unit</span>
            <span>Ingredient</span>
            <span>Prep note</span>
          </div>
          <div className={styles.ingredientRowTrailing} />
        </div>
      )}
      <ul className={styles.rowList}>
        {value.map((row, index) => (
          <IngredientRowFields
            key={row.key}
            row={row}
            index={index}
            isFirst={index === 0}
            isLast={index === value.length - 1}
            onUpdate={(patch) => updateRow(index, patch)}
            onMoveUp={() => moveRow(index, -1)}
            onMoveDown={() => moveRow(index, 1)}
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
  index,
  isFirst,
  isLast,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  row: IngredientRowState;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<IngredientRowState>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const uid = useId();

  const quantityNum = parseFloat(row.quantity);
  const sizeNum = parseFloat(row.sizeQuantity);
  const totalLabel =
    unitHasSize(row.unit) && row.sizeUnit && !Number.isNaN(quantityNum) && !Number.isNaN(sizeNum) && quantityNum > 0 && sizeNum > 0
      ? `${formatTotal(quantityNum * sizeNum)} ${row.sizeUnit} total`
      : null;

  return (
    <li className={styles.ingredientRow}>
      <div className={styles.ingredientRowGrid}>
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
        <Select
          id={`${uid}-unit`}
          value={row.unit}
          onChange={(unit) => onUpdate(unitHasSize(unit) ? { unit } : { unit, sizeQuantity: '', sizeUnit: '' })}
          options={UNITS}
        />

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

      {unitHasSize(row.unit) && (
        <div className={styles.sizeChip}>
          <label className={styles.srOnlyLabel} htmlFor={`${uid}-size-qty`}>
            Size per {row.unit}
          </label>
          <div className={styles.sizeChipQty}>
            <input
              id={`${uid}-size-qty`}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              className={[inputStyles.input, inputStyles.sm].join(' ')}
              value={row.sizeQuantity}
              onChange={(event) => onUpdate({ sizeQuantity: event.target.value })}
              placeholder="Size"
            />
          </div>
          <label className={styles.srOnlyLabel} htmlFor={`${uid}-size-unit`}>
            Size unit
          </label>
          <div className={styles.sizeChipUnit}>
            <Select
              id={`${uid}-size-unit`}
              size="sm"
              value={row.sizeUnit}
              onChange={(sizeUnit) => onUpdate({ sizeUnit })}
              options={[{ value: '', label: '— Size unit —' }, ...SIZE_UNITS]}
            />
          </div>
          <span className={styles.sizeChipHint}>per {row.unit}</span>
          {totalLabel && <span className={styles.sizeChipTotal}>= {totalLabel}</span>}
        </div>
      )}

      <div className={styles.ingredientRowTrailing}>
        <div className={styles.reorderButtons}>
          <Button
            type="button"
            variant="ghost"
            className={styles.reorderButton}
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={`Move ingredient ${index + 1} up`}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={styles.reorderButton}
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={`Move ingredient ${index + 1} down`}
          >
            ↓
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={onRemove} aria-label={`Remove ${row.ingredient || 'ingredient'} row`}>
          Remove
        </Button>
      </div>
    </li>
  );
}

function formatTotal(value: number): string {
  return Number(value.toFixed(4)).toString();
}
