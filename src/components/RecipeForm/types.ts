export type IngredientRowState = {
  key: string;
  ingredient: string;
  quantity: string;
  unit: string;
  prepNote: string;
};

export type StepRowState = {
  key: string;
  text: string;
};

export function makeKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Math.random().toString(36).slice(2)}`;
}

export function emptyIngredientRow(): IngredientRowState {
  return { key: makeKey(), ingredient: '', quantity: '', unit: 'each', prepNote: '' };
}

export function emptyStepRow(): StepRowState {
  return { key: makeKey(), text: '' };
}
