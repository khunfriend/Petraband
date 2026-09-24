import { z } from "zod";
import { ICON_TYPES } from "@/components/stage/InstrumentIcon";

const iconValues = ICON_TYPES.map((t) => t.value) as [string, ...string[]];

// Stage footprint in metres. 0.1 m is a small bell; 10 m is wider than any
// piece we put on stage.
const metres = z.number().min(0.1).max(10);

export const instrumentCreateSchema = z.object({
  nameThai: z.string().trim().min(1).max(60),
  iconType: z.enum(iconValues),
  footprintW: metres,
  footprintH: metres,
  isPlayable: z.boolean(),
});

export const instrumentUpdateSchema = instrumentCreateSchema.partial();
