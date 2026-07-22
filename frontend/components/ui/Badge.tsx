import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "pill"
  | "navy"
  | "coral"
  | "slate"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// design-only §2.8 + palette rules: navy = default emphasis, coral reserved for 1/viewport
const variantClasses: Record<BadgeVariant, string> = {
  pill: "bg-surface-cream-strong text-ink text-[13px] font-medium",
  navy: "bg-primary text-on-primary text-[12px] font-medium",
  coral: "bg-coral text-on-primary text-[11px] font-bold tracking-[1.5px] uppercase",
  slate: "bg-slate-100 text-slate-700 text-[12px] font-medium",
  success:
    "text-[color:var(--color-success-fg)] bg-[color:var(--color-success-bg)] text-[12px] font-medium",
  warning:
    "text-[color:var(--color-warning-fg)] bg-[color:var(--color-warning-bg)] text-[12px] font-medium",
  danger:
    "text-[color:var(--color-danger-fg)] bg-[color:var(--color-danger-bg)] text-[12px] font-medium",
  info:
    "text-[color:var(--color-info-fg)] bg-[color:var(--color-info-bg)] text-[12px] font-medium",
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
