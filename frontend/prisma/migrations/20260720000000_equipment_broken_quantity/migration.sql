ALTER TABLE "Equipment" ADD COLUMN "brokenQuantity" INTEGER NOT NULL DEFAULT 0;

-- Backfill: NEEDS_REPAIR and RETIRED items were entirely unusable; treat their whole quantity as broken.
UPDATE "Equipment" SET "brokenQuantity" = "quantity" WHERE "condition" IN ('NEEDS_REPAIR', 'RETIRED');

ALTER TABLE "Equipment" DROP COLUMN "condition";

DROP TYPE "EquipmentCondition";
