"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wraps children with a subtle fade-in on every route change.
 * Uses --duration-pb-slow / --ease-pb-out from globals.css.
 * prefers-reduced-motion handled globally.
 */
export function RouteFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main
      key={pathname}
      className="pb-page-in flex-1 flex flex-col w-full"
    >
      {children}
    </main>
  );
}
