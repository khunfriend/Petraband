import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: "p" | "h2" | "h3" | "span";
  className?: string;
};

/** Small caps label with a short gold rule in front. */
export function Eyebrow({ children, as: Tag = "p", className = "" }: Props) {
  return (
    <Tag className={`inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-muted ${className}`}>
      <span aria-hidden className="h-px w-6 bg-gold" />
      {children}
    </Tag>
  );
}
