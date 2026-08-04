"use client";

import type { LucideIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from "react";

type FabConfig = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

type FabContextValue = {
  fab: FabConfig | null;
  setFab: (fab: FabConfig | null) => void;
};

const MobileFabContext = createContext<FabContextValue | null>(null);

export function MobileFabProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [fab, setFab] = useState<FabConfig | null>(null);
  const value = useMemo(() => ({ fab, setFab }), [fab]);

  return (
    <MobileFabContext.Provider value={value}>
      {children}
    </MobileFabContext.Provider>
  );
}

/** Read the currently-registered FAB action — used by the mobile tab bar. */
export function useMobileFab(): FabConfig | null {
  const ctx = useContext(MobileFabContext);
  if (!ctx) {
    throw new Error("useMobileFab must be used within MobileFabProvider");
  }
  return ctx.fab;
}

/**
 * A page calls this to put its contextual "+" action (add habit, add
 * transaction, ...) into the shared mobile FAB slot next to the bottom tab
 * bar. Clears itself on unmount so the FAB disappears on pages that don't
 * register one.
 */
export function useRegisterFab(
  config: FabConfig,
  deps: DependencyList = [],
): void {
  const ctx = useContext(MobileFabContext);
  if (!ctx) {
    throw new Error("useRegisterFab must be used within MobileFabProvider");
  }
  const { setFab } = ctx;

  useEffect(() => {
    setFab(config);
    return () => setFab(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
