'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { DocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import inputStyles from './ui/inputs.module.css';
import styles from './ComboBoxInput.module.css';

type ComboBoxOption = { id: number; name: string };

type ComboBoxInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  query: DocumentNode;
  dataKey: 'ingredients' | 'cuisines' | 'tags';
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
};

export function ComboBoxInput({
  id,
  value,
  onChange,
  query,
  dataKey,
  placeholder,
  invalid,
  describedBy,
}: ComboBoxInputProps) {
  const debouncedValue = useDebouncedValue(value, 200);
  const { data, loading } = useQuery<{ [key: string]: ComboBoxOption[] }>(query, {
    variables: { search: debouncedValue.trim() || undefined },
  });
  const options = data?.[dataKey] ?? [];

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = `${id}-listbox`;

  // Reset the highlighted option whenever the option list or open state changes.
  // Adjusted during render (React's recommended pattern for this) rather than in
  // an effect, so it takes effect before the browser paints instead of one render late.
  const resetKey = `${open ? 1 : 0}:${options.map((option) => option.id).join(',')}`;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setActiveIndex(-1);
  }

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeElement = listRef.current.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement | null;
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const commit = (name: string) => {
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((index) => (index + 1 >= options.length ? 0 : index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) return;
      setActiveIndex((index) => (index - 1 < 0 ? options.length - 1 : index - 1));
    } else if (event.key === 'Enter') {
      if (open && activeIndex >= 0 && options[activeIndex]) {
        event.preventDefault();
        commit(options[activeIndex].name);
      } else {
        setOpen(false);
      }
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }
  };

  const showPopup = open && (options.length > 0 || loading);
  const activeId = activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        id={id}
        role="combobox"
        aria-expanded={showPopup}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder={placeholder}
        className={[inputStyles.input, invalid ? inputStyles.invalid : ''].join(' ')}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => options.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {showPopup && (
        <ul id={listboxId} role="listbox" ref={listRef} className={styles.listbox}>
          {loading && options.length === 0 && <li className={styles.status}>Searching…</li>}
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${listboxId}-opt-${index}`}
              data-idx={index}
              role="option"
              aria-selected={index === activeIndex}
              className={[styles.option, index === activeIndex ? styles.active : ''].filter(Boolean).join(' ')}
              onMouseDown={(event) => {
                event.preventDefault();
                commit(option.name);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
