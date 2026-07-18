import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: "p" | "h2" | "h3" | "span";
  className?: string;
};

export function Eyebrow({ children, as: Tag = "p", className = "" }: Props) {
  return (
    <Tag className={`text-xs font-bold tracking-[1.5px] uppercase text-muted ${className}`}>
      {children}
    </Tag>
  );
}
