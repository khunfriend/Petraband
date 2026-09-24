// Built-in stage icons. iconType is stored on Instrument; unknown values fall
// back to a plain rounded square.

// Picker order and Thai labels for the stage settings page.
export const ICON_TYPES: { value: string; label: string }[] = [
  { value: "ranat", label: "ระนาด" },
  { value: "khong", label: "ฆ้องวง" },
  { value: "pi", label: "ปี่ / ขลุ่ย" },
  { value: "so", label: "ซอ" },
  { value: "khim", label: "ขิม" },
  { value: "chakhe", label: "จะเข้" },
  { value: "drum", label: "กลอง" },
  { value: "ching", label: "ฉิ่ง / ฉาบ" },
  { value: "default", label: "ทั่วไป (สี่เหลี่ยม)" },
];

export function InstrumentIcon({ iconType, color }: { iconType: string; color: { bg: string; border: string; text: string } }) {
  switch (iconType) {
    case "ranat":
      return (
        <svg viewBox="0 0 100 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="96" height="36" rx="4" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          {[12, 22, 32, 42, 52, 62, 72, 82].map((x) => (
            <rect key={x} x={x} y="8" width="8" height="24" rx="1.5" fill={color.border} opacity="0.8"/>
          ))}
        </svg>
      );
    case "khong":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="50" rx="46" ry="46" fill={color.bg} stroke={color.border} strokeWidth="3"/>
          <ellipse cx="50" cy="50" rx="36" ry="36" fill="none" stroke={color.border} strokeWidth="1.5" opacity="0.4"/>
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i * 360) / 14;
            const rad = (angle * Math.PI) / 180;
            const cx = (50 + 34 * Math.cos(rad)).toFixed(3);
            const cy = (50 + 34 * Math.sin(rad)).toFixed(3);
            return <circle key={i} cx={cx} cy={cy} r="5" fill={color.border} opacity="0.85"/>;
          })}
          <circle cx="50" cy="50" r="8" fill={color.border} opacity="0.5"/>
        </svg>
      );
    case "pi":
      return (
        <svg viewBox="0 0 40 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="4" width="12" height="92" rx="5" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          {[20, 35, 50, 65, 80].map((y) => (
            <circle key={y} cx="20" cy={y} r="3" fill={color.border} opacity="0.7"/>
          ))}
        </svg>
      );
    case "so":
      return (
        <svg viewBox="0 0 60 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="30" cy="75" rx="22" ry="20" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <line x1="30" y1="10" x2="30" y2="56" stroke={color.border} strokeWidth="4" strokeLinecap="round"/>
          <ellipse cx="30" cy="10" rx="8" ry="5" fill={color.border} opacity="0.6"/>
          <line x1="8" y1="75" x2="52" y2="75" stroke={color.border} strokeWidth="1.5" opacity="0.5"/>
        </svg>
      );
    case "khim":
      return (
        <svg viewBox="0 0 120 70" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <polygon points="10,65 110,65 100,5 20,5" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          {[20, 35, 50, 65, 80, 95].map((x, i) => (
            <line key={i} x1={x} y1="60" x2={x - 5 + 10} y2="10" stroke={color.border} strokeWidth="1.5" opacity="0.6"/>
          ))}
        </svg>
      );
    case "chakhe":
      return (
        <svg viewBox="0 0 150 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="75" cy="25" rx="70" ry="18" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <line x1="5" y1="25" x2="145" y2="25" stroke={color.border} strokeWidth="1.5" opacity="0.4"/>
          {[25, 50, 75, 100, 125].map((x) => (
            <line key={x} x1={x} y1="12" x2={x} y2="38" stroke={color.border} strokeWidth="1.5" opacity="0.6"/>
          ))}
          <ellipse cx="75" cy="25" rx="8" ry="8" fill={color.border} opacity="0.35"/>
        </svg>
      );
    case "drum":
      return (
        <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="40" rx="36" ry="36" fill={color.bg} stroke={color.border} strokeWidth="3"/>
          <ellipse cx="40" cy="40" rx="24" ry="24" fill="none" stroke={color.border} strokeWidth="1.5" opacity="0.5"/>
          <ellipse cx="40" cy="40" rx="10" ry="10" fill={color.border} opacity="0.4"/>
        </svg>
      );
    case "ching":
      return (
        <svg viewBox="0 0 80 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="14" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <circle cx="20" cy="20" r="5" fill={color.border} opacity="0.6"/>
          <circle cx="60" cy="20" r="14" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <circle cx="60" cy="20" r="5" fill={color.border} opacity="0.6"/>
          <line x1="34" y1="20" x2="46" y2="20" stroke={color.border} strokeWidth="2" strokeDasharray="3,2" opacity="0.5"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="72" height="72" rx="8" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
        </svg>
      );
  }
}
