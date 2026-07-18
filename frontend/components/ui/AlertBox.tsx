import type { ReactNode } from "react";

type Variant = "success" | "error" | "warning";

const VARIANT_CLASSES: Record<Variant, string> = {
  success: "text-success bg-success/10 border-success/30",
  error: "text-error bg-error/10 border-error/30",
  warning: "text-warning bg-warning/10 border-warning/30",
};

type Props = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

export function AlertBox({ variant, children, className = "" }: Props) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={`text-sm rounded-[var(--radius-md)] border px-3 py-3 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </p>
  );
}
