export type IngredientRowState = {
  key: string;
  ingredient: string;
  quantity: string;
  unit: string;
  sizeQuantity: string;
  sizeUnit: string;
  prepNote: string;
};

export function makeKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Math.random().toString(36).slice(2)}`;
}

export function emptyIngredientRow(): IngredientRowState {
  return { key: makeKey(), ingredient: '', quantity: '', unit: 'each', sizeQuantity: '', sizeUnit: '', prepNote: '' };
}
