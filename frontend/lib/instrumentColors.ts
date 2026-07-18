export type InstrumentColor = { bg: string; border: string; text: string };

export const INSTRUMENT_COLORS: Record<string, InstrumentColor> = {
  ranat:   { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  khong:   { bg: "#dcfce7", border: "#22c55e", text: "#15803d" },
  pi:      { bg: "#fef9c3", border: "#eab308", text: "#854d0e" },
  so:      { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
  khim:    { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" },
  chakhe:  { bg: "#fff7ed", border: "#f97316", text: "#9a3412" },
  drum:    { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  ching:   { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  default: { bg: "#f1f5f9", border: "#94a3b8", text: "#334155" },
};

export function getInstrumentColor(iconType: string): InstrumentColor {
  return INSTRUMENT_COLORS[iconType] ?? INSTRUMENT_COLORS.default;
}
