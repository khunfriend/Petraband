import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-10 w-full rounded-[var(--radius-md)] border border-hairline bg-white px-3.5 text-sm text-ink placeholder:text-muted-soft",
            "transition-colors duration-[var(--duration-pb-base)] ease-[var(--ease-pb)]",
            "focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15",
            error && "border-error focus:border-error focus:ring-error/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
