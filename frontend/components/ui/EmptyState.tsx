import type { ReactNode } from "react";
import { Card } from "./Card";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className = "" }: Props) {
  return (
    <Card className={`text-center py-10 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        {icon && <div className="text-3xl text-muted-soft leading-none">{icon}</div>}
        <p className="text-base font-semibold text-ink">{title}</p>
        {description && <p className="text-sm text-muted max-w-md">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </Card>
  );
}
