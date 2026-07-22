import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

type Variant = "success" | "warning" | "danger" | "info";

// design-only §2.8 semantic palette
const VARIANT: Record<
  Variant,
  { fg: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    fg: "var(--color-success-fg)",
    bg: "var(--color-success-bg)",
    Icon: CheckCircle2,
  },
  warning: {
    fg: "var(--color-warning-fg)",
    bg: "var(--color-warning-bg)",
    Icon: AlertTriangle,
  },
  danger: {
    fg: "var(--color-danger-fg)",
    bg: "var(--color-danger-bg)",
    Icon: XCircle,
  },
  info: {
    fg: "var(--color-info-fg)",
    bg: "var(--color-info-bg)",
    Icon: Info,
  },
};

type Props = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

export function AlertBox({ variant, children, className = "" }: Props) {
  const { fg, bg, Icon } = VARIANT[variant];
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={`flex items-start gap-2.5 text-sm rounded-[var(--radius-md)] border px-3 py-3 ${className}`}
      style={{ color: fg, backgroundColor: bg, borderColor: `${fg}33` }}
    >
      <Icon size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" />
      <div className="flex-1 leading-[1.5]">{children}</div>
    </div>
  );
}
