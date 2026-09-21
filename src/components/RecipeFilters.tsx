'use client';

import { CATEGORIES, TIME_BUCKETS } from '@/src/lib/constants';
import { CUISINES_QUERY } from '@/src/lib/graphql/documents';
import { ComboBoxInput } from './ComboBoxInput';
import { TagsInput } from './TagsInput';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import { Select } from './ui/Select';
import styles from './RecipeFilters.module.css';

export type FiltersState = {
  cuisine: string;
  tags: string[];
  category: string;
  timeBucket: string;
};

export const EMPTY_FILTERS: FiltersState = {
  cuisine: '',
  tags: [],
  category: '',
  timeBucket: '',
};

export function hasActiveFilters(filters: FiltersState): boolean {
  return (
    filters.cuisine.trim() !== '' || filters.tags.length > 0 || filters.category !== '' || filters.timeBucket !== ''
  );
}

type RecipeFiltersProps = {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
};

export function RecipeFilters({ value, onChange }: RecipeFiltersProps) {
  const update = (patch: Partial<FiltersState>) => onChange({ ...value, ...patch });

  return (
    <div className={styles.filters}>
      <div className={styles.row}>
        <FormField label="Cuisine" htmlFor="filter-cuisine">
          <ComboBoxInput
            id="filter-cuisine"
            value={value.cuisine}
            onChange={(cuisine) => update({ cuisine })}
            query={CUISINES_QUERY}
            dataKey="cuisines"
            placeholder="Any cuisine"
          />
        </FormField>

        <FormField label="Category" htmlFor="filter-category">
          <Select
            id="filter-category"
            value={value.category}
            onChange={(category) => update({ category })}
            options={[{ value: '', label: 'Any category' }, ...CATEGORIES.map((category) => ({ value: category, label: category }))]}
          />
        </FormField>

        <FormField label="Total time" htmlFor="filter-time">
          <Select
            id="filter-time"
            value={value.timeBucket}
            onChange={(timeBucket) => update({ timeBucket })}
            options={[{ value: '', label: 'Any time' }, ...TIME_BUCKETS]}
          />
        </FormField>
      </div>

      <FormField label="Tags" htmlFor="filter-tags">
        <TagsInput id="filter-tags" value={value.tags} onChange={(tags) => update({ tags })} />
      </FormField>

      {hasActiveFilters(value) && (
        <Button type="button" variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
