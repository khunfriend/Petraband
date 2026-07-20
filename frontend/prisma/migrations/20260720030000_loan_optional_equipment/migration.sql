-- Drop existing FK so we can change ON DELETE behavior and make column nullable
ALTER TABLE "EquipmentLoan" DROP CONSTRAINT "EquipmentLoan_equipmentId_fkey";

-- Make equipmentId nullable (BORROWED_IN loans won't be tied to inventory)
ALTER TABLE "EquipmentLoan" ALTER COLUMN "equipmentId" DROP NOT NULL;

-- Add equipmentName column (nullable first so we can backfill, then enforce)
ALTER TABLE "EquipmentLoan" ADD COLUMN "equipmentName" TEXT;

-- Backfill from linked equipment
UPDATE "EquipmentLoan" l
SET "equipmentName" = e."name"
FROM "Equipment" e
WHERE l."equipmentId" = e."id";

-- Fallback for any orphaned rows
UPDATE "EquipmentLoan" SET "equipmentName" = 'ไม่ระบุ' WHERE "equipmentName" IS NULL;

-- Enforce not null
ALTER TABLE "EquipmentLoan" ALTER COLUMN "equipmentName" SET NOT NULL;

-- Re-add FK with SET NULL so deleting equipment keeps the loan record intact
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_equipmentId_fkey"
  FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
