export const CATEGORIES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack', 'Drinks'] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNITS = [
  { value: 'cup', label: 'cup', plural: 'cups' },
  { value: 'tbsp', label: 'tbsp', plural: 'tbsps' },
  { value: 'tsp', label: 'tsp', plural: 'tsps' },
  { value: 'fl oz', label: 'fl oz', plural: 'fl oz' },
  { value: 'oz', label: 'oz', plural: 'oz' },
  { value: 'lb', label: 'lb', plural: 'lbs' },
  { value: 'g', label: 'g', plural: 'g' },
  { value: 'kg', label: 'kg', plural: 'kg' },
  { value: 'mg', label: 'mg', plural: 'mg' },
  { value: 'ml', label: 'ml', plural: 'ml' },
  { value: 'l', label: 'l', plural: 'l' },
  { value: 'clove', label: 'clove', plural: 'cloves' },
  { value: 'pinch', label: 'pinch', plural: 'pinches' },
  { value: 'dash', label: 'dash', plural: 'dashes' },
  { value: 'can', label: 'can', plural: 'cans', hasSize: true },
  { value: 'jar', label: 'jar', plural: 'jars', hasSize: true },
  { value: 'bottle', label: 'bottle', plural: 'bottles', hasSize: true },
  { value: 'package', label: 'package', plural: 'packages', hasSize: true },
  { value: 'box', label: 'box', plural: 'boxes', hasSize: true },
  { value: 'whole', label: 'whole', plural: 'whole' },
  { value: 'stick', label: 'stick', plural: 'sticks', hasSize: true },
  { value: 'each', label: 'each', plural: 'each' },
  { value: 'to taste', label: 'to taste', plural: 'to taste' },
  { value: 'as needed', label: 'as needed', plural: 'as needed' },
] as const;

// Units that describe a container/package rather than a raw measure (e.g. "can", "jar") can
// carry a size, like "15 oz" or "400 g", so the actual amount purchased is unambiguous.
export function unitHasSize(unit: string): boolean {
  return UNITS.some((option) => option.value === unit && 'hasSize' in option && option.hasSize);
}

// Only weight/volume measures make sense as a container size (a "can" can't be sized in "cloves").
export const SIZE_UNITS = UNITS.filter((option) =>
  ['fl oz', 'oz', 'lb', 'g', 'kg', 'mg', 'ml', 'l', 'cup', 'tbsp', 'tsp'].includes(option.value)
);

export function pluralizeUnit(unit: string, quantity: number | null | undefined): string {
  if (quantity == null || quantity <= 1) return unit;
  return UNITS.find((option) => option.value === unit)?.plural ?? unit;
}

export const TIME_BUCKETS = [
  { value: 'UNDER_30', label: 'Under 30 min' },
  { value: 'THIRTY_TO_60', label: '30–60 min' },
  { value: 'OVER_60', label: '1 hr+' },
] as const;

export type TimeBucket = (typeof TIME_BUCKETS)[number]['value'];
