-- Accessories become configurable instead of the hard-coded stand / mic stand
-- (one per person) and per-instrument chairs / tables.
CREATE TABLE "AccessoryType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "perPlayer" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AccessoryType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AccessoryType_name_key" ON "AccessoryType"("name");

-- The four the performance page used to hard-code, with the same counting.
INSERT INTO "AccessoryType" ("id", "name", "perPlayer", "sortOrder") VALUES
    ('acc_stand', 'สแตนโน้ต', 1, 0),
    ('acc_mic',   'ขาไมค์',   1, 1),
    ('acc_chair', 'เก้าอี้',   0, 2),
    ('acc_table', 'โต๊ะ',     0, 3);

ALTER TABLE "InstrumentEquipment" ADD COLUMN "accessories" JSONB NOT NULL DEFAULT '{}';

-- Carry over any chairs / tables already set per instrument.
UPDATE "InstrumentEquipment"
SET "accessories" = jsonb_build_object('acc_chair', "chairs")
    || CASE WHEN "tables" IS NOT NULL THEN jsonb_build_object('acc_table', "tables") ELSE '{}'::jsonb END;

ALTER TABLE "InstrumentEquipment" DROP COLUMN "chairs", DROP COLUMN "tables";
