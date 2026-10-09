import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: "p" | "h2" | "h3" | "span";
  className?: string;
};

/** Small muted label above a heading. */
export function Eyebrow({ children, as: Tag = "p", className = "" }: Props) {
  return <Tag className={`text-xs font-medium text-muted ${className}`}>{children}</Tag>;
}
