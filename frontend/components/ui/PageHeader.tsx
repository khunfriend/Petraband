import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Unified page header — eyebrow + h1 + optional actions.
 * Use at the top of every top-level route so spacing/typography stays consistent.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: Props) {
  return (
    <header
      className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className="flex flex-col gap-2 min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-base text-body leading-[1.7] max-w-[720px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
