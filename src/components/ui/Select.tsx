'use client';

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Select.module.css';

export type SelectOption = { value: string; label: string };

type SelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectOption | string>;
  size?: 'md' | 'sm';
  invalid?: boolean;
  disabled?: boolean;
  ariaDescribedBy?: string;
};

function normalize(options: ReadonlyArray<SelectOption | string>): SelectOption[] {
  return options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));
}

export function Select({ id, value, onChange, options, size = 'md', invalid, disabled, ariaDescribedBy }: SelectProps) {
  const normalized = useMemo(() => normalize(options), [options]);
  const selectedIndex = normalized.findIndex((option) => option.value === value);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const listboxId = `${id}-listbox`;
  const optionIdPrefix = `${id}-option`;

  const selected = normalized[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listboxRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const activeElement = listboxRef.current?.children[activeIndex] as HTMLElement | undefined;
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const close = (refocusTrigger: boolean) => {
    setOpen(false);
    if (refocusTrigger) buttonRef.current?.focus();
  };

  const commit = (index: number) => {
    const option = normalized[index];
    if (option) onChange(option.value);
    close(true);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault();
        openAt(selectedIndex >= 0 ? selectedIndex : 0);
        break;
      default:
        break;
    }
  };

  const handleListboxKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, normalized.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(normalized.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab':
        close(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        className={[styles.trigger, size === 'sm' ? styles.sm : '', invalid ? styles.invalid : '']
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => (open ? close(false) : openAt(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={selected ? styles.value : styles.placeholder}>{selected?.label ?? ''}</span>
        <span className={styles.chevron} aria-hidden="true" data-open={open || undefined} />
      </button>
      {open && (
        <ul
          ref={listboxRef}
          className={styles.listbox}
          role="listbox"
          id={listboxId}
          tabIndex={-1}
          aria-activedescendant={`${optionIdPrefix}-${activeIndex}`}
          onKeyDown={handleListboxKeyDown}
        >
          {normalized.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${optionIdPrefix}-${index}`}
                role="option"
                aria-selected={isSelected}
                className={[styles.option, index === activeIndex ? styles.active : ''].filter(Boolean).join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(index)}
              >
                <span className={styles.check} aria-hidden="true">
                  {isSelected ? '✓' : ''}
                </span>
                <span>{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
