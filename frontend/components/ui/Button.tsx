import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "coral" | "secondary" | "secondary-dark" | "text";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-active active:bg-primary-active disabled:bg-primary-disabled disabled:text-muted",
  coral:
    "bg-coral text-on-primary hover:opacity-90 active:opacity-80 disabled:bg-primary-disabled disabled:text-muted",
  secondary:
    "bg-canvas text-ink border border-hairline hover:bg-surface-cream-strong active:bg-surface-cream-strong disabled:opacity-50",
  "secondary-dark":
    "bg-surface-dark-elevated text-on-dark hover:bg-primary-active active:bg-primary-active disabled:opacity-50",
  text: "bg-transparent text-ink hover:bg-surface-cream-strong active:bg-surface-cream-strong disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  md: "h-10 px-5 text-sm font-medium",
  sm: "h-8 px-3 text-xs font-medium",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] transition-colors duration-150 cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
