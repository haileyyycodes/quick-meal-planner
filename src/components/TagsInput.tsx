'use client';

import { KeyboardEvent, useId, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { TAGS_QUERY } from '@/src/lib/graphql/documents';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import { Button } from './ui/Button';
import inputStyles from './ui/inputs.module.css';
import styles from './TagsInput.module.css';

type TagsInputProps = {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  describedBy?: string;
};

export function TagsInput({ id, value, onChange, describedBy }: TagsInputProps) {
  const [draft, setDraft] = useState('');
  const listId = useId();
  const debouncedDraft = useDebouncedValue(draft, 200);
  const { data } = useQuery<{ tags: Array<{ id: number; name: string }> }>(TAGS_QUERY, {
    variables: { search: debouncedDraft.trim() || undefined },
  });

  const suggestions = (data?.tags ?? []).filter(
    (tag) => !value.some((existing) => existing.toLowerCase() === tag.name.toLowerCase())
  );

  const addTag = (raw: string) => {
    const tagName = raw.trim();
    if (!tagName) return;
    if (value.some((existing) => existing.toLowerCase() === tagName.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, tagName]);
    setDraft('');
  };

  const removeTag = (tagName: string) => {
    onChange(value.filter((existing) => existing !== tagName));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div>
      {value.length > 0 && (
        <ul className={styles.chipList} aria-label="Selected tags">
          {value.map((tag) => (
            <li key={tag} className={styles.chip}>
              <span>{tag}</span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.addRow}>
        <input
          id={id}
          list={listId}
          type="text"
          className={inputStyles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag and press Enter"
          aria-describedby={describedBy}
          autoComplete="off"
        />
        <datalist id={listId}>
          {suggestions.map((tag) => (
            <option key={tag.id} value={tag.name} />
          ))}
        </datalist>
        <Button type="button" variant="secondary" onClick={() => addTag(draft)} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
