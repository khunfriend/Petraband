import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "dark" | "coral";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface-card border border-hairline-soft text-ink",
  dark: "bg-surface-dark text-on-dark",
  coral: "bg-coral text-on-primary",
};

function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] p-6",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };
