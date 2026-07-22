type Props = {
  /** Fill color token — pass Tailwind text-* class or CSS color */
  className?: string;
  /** Height in px (default 40) */
  height?: number;
};

/**
 * Wave divider — สื่อ metaphor "คลื่น" ตาม design-only §1.
 * Use between full-bleed sections. The wave fill = currentColor;
 * pass a text-* class to set it (e.g. `text-surface-cream-strong`).
 */
export function SectionDivider({
  className = "text-surface-cream-strong",
  height = 40,
}: Props) {
  return (
    <svg
      className={`block w-full ${className}`}
      style={{ height }}
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 40 Q 240 0 480 40 T 960 40 T 1440 40 V 80 H 0 Z"
        fill="currentColor"
      />
    </svg>
  );
}
