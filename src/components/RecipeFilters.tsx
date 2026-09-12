'use client';

import { CATEGORIES, TIME_BUCKETS } from '@/src/lib/constants';
import { CUISINES_QUERY } from '@/src/lib/graphql/documents';
import { ComboBoxInput } from './ComboBoxInput';
import { TagsInput } from './TagsInput';
import { Button } from './ui/Button';
import { FormField } from './ui/FormField';
import inputStyles from './ui/inputs.module.css';
import styles from './RecipeFilters.module.css';

export type FiltersState = {
  name: string;
  ingredient: string;
  cuisine: string;
  tags: string[];
  category: string;
  timeBucket: string;
};

export const EMPTY_FILTERS: FiltersState = {
  name: '',
  ingredient: '',
  cuisine: '',
  tags: [],
  category: '',
  timeBucket: '',
};

export function hasActiveFilters(filters: FiltersState): boolean {
  return (
    filters.name.trim() !== '' ||
    filters.ingredient.trim() !== '' ||
    filters.cuisine.trim() !== '' ||
    filters.tags.length > 0 ||
    filters.category !== '' ||
    filters.timeBucket !== ''
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
        <FormField label="Search by name" htmlFor="filter-name">
          <input
            id="filter-name"
            type="search"
            className={inputStyles.input}
            value={value.name}
            onChange={(event) => update({ name: event.target.value })}
            placeholder="e.g. Chili"
          />
        </FormField>

        <FormField label="Ingredient" htmlFor="filter-ingredient">
          <input
            id="filter-ingredient"
            type="search"
            className={inputStyles.input}
            value={value.ingredient}
            onChange={(event) => update({ ingredient: event.target.value })}
            placeholder="e.g. Chicken"
          />
        </FormField>

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
          <select
            id="filter-category"
            className={inputStyles.select}
            value={value.category}
            onChange={(event) => update({ category: event.target.value })}
          >
            <option value="">Any category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Total time" htmlFor="filter-time">
          <select
            id="filter-time"
            className={inputStyles.select}
            value={value.timeBucket}
            onChange={(event) => update({ timeBucket: event.target.value })}
          >
            <option value="">Any time</option>
            {TIME_BUCKETS.map((bucket) => (
              <option key={bucket.value} value={bucket.value}>
                {bucket.label}
              </option>
            ))}
          </select>
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
