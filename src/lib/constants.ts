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
  { value: 'can', label: 'can', plural: 'cans' },
  { value: 'jar', label: 'jar', plural: 'jars' },
  { value: 'bottle', label: 'bottle', plural: 'bottles' },
  { value: 'package', label: 'package', plural: 'packages' },
  { value: 'box', label: 'box', plural: 'boxes' },
  { value: 'whole', label: 'whole', plural: 'whole' },
  { value: 'stick', label: 'stick', plural: 'sticks' },
  { value: 'each', label: 'each', plural: 'each' },
  { value: 'to taste', label: 'to taste', plural: 'to taste' },
  { value: 'as needed', label: 'as needed', plural: 'as needed' },
] as const;

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
