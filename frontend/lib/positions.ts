// Instrument positions a member can take in a performance, grouped for the
// picker. Accessory counts (InstrumentEquipment.name) are keyed by these names.
export const POSITION_GROUPS: { label: string; positions: string[] }[] = [
  {
    label: "เครื่องตี (ดำเนินทำนอง)",
    positions: ["ระนาดเอก", "ระนาดทุ้ม", "ฆ้องวงเล็ก", "ฆ้องวงใหญ่", "ขิม", "ขิม จิ๋ว", "ระฆังราว"],
  },
  { label: "เครื่องสี · ดีด", positions: ["ซอด้วง", "ซออู้", "ซอสามสาย", "จะเข้"] },
  { label: "เครื่องเป่า", positions: ["ขลุ่ย", "แคน", "แคนจิ๋ว"] },
  {
    label: "กลอง",
    positions: ["ตะโพน", "กลองทัดเสียงสูง", "กลองทัดเสียงต่ำ", "กลองแขกตัวผู้", "กลองแขกตัวเมีย", "โทนรำมะนา", "คาฮอง"],
  },
  {
    label: "เครื่องประกอบจังหวะ",
    positions: ["ฉิ่ง", "ฉาบเล็ก", "ฉาบใหญ่", "กรับเสภา", "กรับพวง", "แทมบูรีน", "ลูกแซ็ก"],
  },
  { label: "อื่นๆ", positions: ["อื่นๆ"] },
];

export const POSITIONS = POSITION_GROUPS.flatMap((g) => g.positions);
