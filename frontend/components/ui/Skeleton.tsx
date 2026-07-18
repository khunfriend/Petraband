type Props = {
  className?: string;
  count?: number;
};

export function Skeleton({ className = "h-4 w-full", count = 1 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className={`animate-pulse rounded-[var(--radius-sm)] bg-hairline-soft ${className}`}
        />
      ))}
    </>
  );
}
