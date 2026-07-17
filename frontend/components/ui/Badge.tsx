import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "pill" | "coral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  pill: "bg-surface-cream-strong text-ink text-[13px] font-medium",
  coral: "bg-coral text-on-primary text-[11px] font-bold tracking-[1.5px] uppercase",
};

function Badge({ variant = "pill", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-[var(--radius-pill)]",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
