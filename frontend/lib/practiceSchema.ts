import { z } from "zod";

export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "เวลาต้องเป็น HH:MM");

/** One practice slot as sent by the editors; end must come after start. */
export const practiceSlotInput = z
  .object({
    startTime: hhmm,
    endTime: hhmm,
    label: z.string().max(1000).default(""),
    location: z.string().trim().max(100).default(""),
    isSpecial: z.boolean().default(false),
  })
  .refine((s) => s.startTime < s.endTime, { message: "เวลาจบต้องหลังเวลาเริ่ม", path: ["endTime"] });
