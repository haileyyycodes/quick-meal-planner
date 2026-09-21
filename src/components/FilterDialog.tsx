'use client';

import { useEffect, useRef, useState } from 'react';
import { FiltersState, RecipeFilters } from './RecipeFilters';
import { Button } from './ui/Button';
import styles from './FilterDialog.module.css';

type FilterDialogProps = {
  open: boolean;
  value: FiltersState;
  onApply: (next: FiltersState) => void;
  onCancel: () => void;
};

export function FilterDialog({ open, value, onApply, onCancel }: FilterDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setDraft(value);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // Only re-sync the draft when the dialog transitions open; `value` itself shouldn't reset an in-progress edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="filter-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onCancel();
        }
      }}
    >
      <h2 id="filter-dialog-title" className={styles.title}>
        Filter recipes
      </h2>

      <RecipeFilters value={draft} onChange={setDraft} />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="primary" onClick={() => onApply(draft)}>
          Apply
        </Button>
      </div>
    </dialog>
  );
}
