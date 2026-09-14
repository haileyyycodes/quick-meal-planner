'use client';

import { useId } from 'react';
import type { DocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import inputStyles from './ui/inputs.module.css';

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
  const listId = useId();
  const debouncedValue = useDebouncedValue(value, 200);
  const { data } = useQuery<{ [key: string]: Array<{ id: number; name: string }> }>(query, {
    variables: { search: debouncedValue.trim() || undefined },
  });

  const options = data?.[dataKey] ?? [];

  return (
    <>
      <input
        id={id}
        list={listId}
        type="text"
        className={[inputStyles.input, invalid ? inputStyles.invalid : ''].join(' ')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.id} value={option.name} />
        ))}
      </datalist>
    </>
  );
}
