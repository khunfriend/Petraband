-- Add rich-text runs column to Cell.
-- Format: JSONB array of runs, e.g.
--   [{"text":"ด","fontSize":16},{"text":"4","fontSize":4}]
-- When null, fall back to plain `cellValue` + Cell.style defaults.
ALTER TABLE "Cell" ADD COLUMN "richValue" JSONB;

-- Backfill: wrap existing non-empty cellValue as a single run so readers
-- can treat richValue as the source of truth going forward.
UPDATE "Cell"
SET "richValue" = jsonb_build_array(jsonb_build_object('text', "cellValue"))
WHERE "cellValue" IS NOT NULL AND "cellValue" <> '';
