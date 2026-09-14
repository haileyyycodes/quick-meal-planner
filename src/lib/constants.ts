export const CATEGORIES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack', 'Drinks'] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNITS = [
  { value: 'cup', label: 'cup' },
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'fl oz', label: 'fl oz' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'mg', label: 'mg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'clove', label: 'clove' },
  { value: 'pinch', label: 'pinch' },
  { value: 'dash', label: 'dash' },
  { value: 'can', label: 'can' },
  { value: 'package', label: 'package' },
  { value: 'whole', label: 'whole' },
  { value: 'stick', label: 'stick' },
  { value: 'each', label: 'each' },
  { value: 'to taste', label: 'to taste' },
  { value: 'as needed', label: 'as needed' },
] as const;

export const TIME_BUCKETS = [
  { value: 'UNDER_30', label: 'Under 30 min' },
  { value: 'THIRTY_TO_60', label: '30–60 min' },
  { value: 'OVER_60', label: '1 hr+' },
] as const;

export type TimeBucket = (typeof TIME_BUCKETS)[number]['value'];
