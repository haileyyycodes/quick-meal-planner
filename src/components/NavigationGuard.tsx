'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RECIPE_FORM_ID } from './EditRecipeCard';
import { ConfirmDialog } from './ui/ConfirmDialog';

// Both the "new recipe" form and the "edit recipe" form share this guard: leaving either
// without saving should warn, since both have a live <form id={RECIPE_FORM_ID}> to submit.
const GUARDED_RECIPE_ROUTE_PATTERN = /^\/recipes\/(new|\d+\/edit)$/;

type NavigationGuardContextValue = {
  /** True while a recipe create/edit form (with unsaved work) is on screen. */
  isFormActive: boolean;
  guardedNavigate: (href: string) => void;
  /** Reads and clears the nav target a guarded save should redirect to, if any. */
  consumePendingHref: () => string | null;
};

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isFormActive = GUARDED_RECIPE_ROUTE_PATTERN.test(pathname);

  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);

  const guardedNavigate = useCallback(
    (href: string) => {
      if (isFormActive) {
        setPendingHref(href);
        setWarningOpen(true);
      } else {
        router.push(href);
      }
    },
    [isFormActive, router]
  );

  const consumePendingHref = useCallback(() => {
    let href: string | null = null;
    setPendingHref((current) => {
      href = current;
      return null;
    });
    return href;
  }, []);

  const value = useMemo(
    () => ({ isFormActive, guardedNavigate, consumePendingHref }),
    [isFormActive, guardedNavigate, consumePendingHref]
  );

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={warningOpen}
        title="Leave without saving?"
        description="Your changes to this recipe haven't been saved yet. If you leave now, they'll be lost."
        confirmLabel="Save"
        cancelLabel="Cancel"
        tertiaryLabel="Leave without saving"
        onTertiary={() => {
          setWarningOpen(false);
          if (pendingHref) router.push(pendingHref);
          setPendingHref(null);
        }}
        onConfirm={() => {
          setWarningOpen(false);
          const form = document.getElementById(RECIPE_FORM_ID);
          if (form instanceof HTMLFormElement) form.requestSubmit();
        }}
        onCancel={() => {
          setWarningOpen(false);
          setPendingHref(null);
        }}
      />
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) throw new Error('useNavigationGuard must be used within a NavigationGuardProvider');
  return context;
}
