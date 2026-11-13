"use client";

import { createContext, use } from "react";

import type { ModuleSuite } from "@/lib/brand";

/**
 * The suites the menus may link to: those holding a module with a
 * production sign-off (`advertisedSuiteKeys`, read once in the root layout).
 * The menus run in the browser and cannot read sign-offs themselves.
 * Defaults to none — a menu rendered outside the provider links to no suite
 * rather than to a page that answers not-found.
 */
const AdvertisedSuitesContext = createContext<readonly ModuleSuite[]>([]);

export function AdvertisedSuitesProvider({
  suites,
  children,
}: {
  suites: readonly ModuleSuite[];
  children: React.ReactNode;
}) {
  return <AdvertisedSuitesContext value={suites}>{children}</AdvertisedSuitesContext>;
}

export function useAdvertisedSuites(): readonly ModuleSuite[] {
  return use(AdvertisedSuitesContext);
}
