'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Recipe } from '@/src/lib/graphql/types';
import { EMPTY_METADATA, metadataFromRecipe, RecipeMetadataState } from './RecipeForm/metadata';

type RecipeMetadataContextValue = {
  value: RecipeMetadataState;
  onChange: (patch: Partial<RecipeMetadataState>) => void;
  nameError: string | null;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  reset: (recipe?: Recipe) => void;
  /** Validates the name field, focusing + flagging it if empty. Returns whether it's valid. */
  validateName: () => boolean;
};

const RecipeMetadataContext = createContext<RecipeMetadataContextValue | null>(null);

export function RecipeMetadataProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<RecipeMetadataState>(EMPTY_METADATA);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const onChange = useCallback((patch: Partial<RecipeMetadataState>) => {
    setValue((current) => ({ ...current, ...patch }));
    if (patch.name !== undefined) setNameError(null);
  }, []);

  const reset = useCallback((recipe?: Recipe) => {
    setValue(metadataFromRecipe(recipe));
    setNameError(null);
  }, []);

  const validateName = useCallback(() => {
    if (!value.name.trim()) {
      setNameError('Recipe name is required.');
      nameInputRef.current?.focus();
      return false;
    }
    setNameError(null);
    return true;
  }, [value.name]);

  const contextValue = useMemo(
    () => ({ value, onChange, nameError, nameInputRef, reset, validateName }),
    [value, onChange, nameError, reset, validateName]
  );

  return <RecipeMetadataContext.Provider value={contextValue}>{children}</RecipeMetadataContext.Provider>;
}

export function useRecipeMetadata() {
  const context = useContext(RecipeMetadataContext);
  if (!context) throw new Error('useRecipeMetadata must be used within a RecipeMetadataProvider');
  return context;
}
