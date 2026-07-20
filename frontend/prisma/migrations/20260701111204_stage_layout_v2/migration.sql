/*
  Warnings:

  - You are about to drop the column `h` on the `StageItem` table. All the data in the column will be lost.
  - You are about to drop the column `w` on the `StageItem` table. All the data in the column will be lost.
  - You are about to drop the column `currentVersionId` on the `StageLayout` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `StageLayout` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `StageLayout` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `StageTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `layoutJson` on the `StageTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `StageTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Instrument" ADD COLUMN     "footprintH" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "footprintW" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "iconType" TEXT NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE "StageItem" DROP COLUMN "h",
DROP COLUMN "w",
ADD COLUMN     "layerOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "x" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "y" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "StageLayout" DROP COLUMN "currentVersionId",
DROP COLUMN "height",
DROP COLUMN "width",
ADD COLUMN     "heightUnits" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'ผังเวที',
ADD COLUMN     "unitLabel" TEXT NOT NULL DEFAULT 'm',
ADD COLUMN     "widthUnits" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "StageLayoutVersion" ADD COLUMN     "changeNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "versionNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "StageTemplate" DROP COLUMN "height",
DROP COLUMN "layoutJson",
DROP COLUMN "width",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "heightUnits" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN     "placementsJson" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "unitLabel" TEXT NOT NULL DEFAULT 'm',
ADD COLUMN     "widthUnits" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- AddForeignKey
ALTER TABLE "StageTemplate" ADD CONSTRAINT "StageTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
