-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "PracticeSchedule" DROP CONSTRAINT "PracticeSchedule_createdById_fkey";

-- DropForeignKey
ALTER TABLE "StageItem" DROP CONSTRAINT "StageItem_instrumentId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_secondaryInstrumentId_fkey";

-- DropIndex
DROP INDEX "PerformanceMember_userId_performanceId_key";

-- AlterTable
ALTER TABLE "Performance" ADD COLUMN     "equipmentNotes" JSONB;

-- AlterTable
ALTER TABLE "PerformanceMember" ADD COLUMN     "position" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "defaultBpm" INTEGER,
ADD COLUMN     "defaultTimeSig" TEXT;

-- AlterTable
ALTER TABLE "StageItem" ADD COLUMN     "customHeight" DOUBLE PRECISION,
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "customWidth" DOUBLE PRECISION,
ALTER COLUMN "instrumentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "secondaryInstrumentId",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isTemporary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "linkedPerformanceId" TEXT,
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "generation" SET DEFAULT '';

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSecondaryInstrument" (
    "userId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,

    CONSTRAINT "UserSecondaryInstrument_pkey" PRIMARY KEY ("userId","instrumentId")
);

-- CreateTable
CREATE TABLE "InstrumentEquipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chairs" INTEGER NOT NULL DEFAULT 0,
    "tables" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InstrumentEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notebook" (
    "id" TEXT NOT NULL,
    "songId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Sheet1',
    "sheetOrder" INTEGER NOT NULL DEFAULT 0,
    "columnCount" INTEGER NOT NULL DEFAULT 8,
    "rowCount" INTEGER NOT NULL DEFAULT 20,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "cellValue" TEXT,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CellStyle" (
    "id" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL DEFAULT 'Sarabun',
    "fontSize" INTEGER NOT NULL DEFAULT 14,
    "isBold" BOOLEAN NOT NULL DEFAULT false,
    "isItalic" BOOLEAN NOT NULL DEFAULT false,
    "isUnderline" BOOLEAN NOT NULL DEFAULT false,
    "textAlign" TEXT NOT NULL DEFAULT 'center',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "highlightColor" TEXT,

    CONSTRAINT "CellStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MergedCell" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "startRow" INTEGER NOT NULL,
    "startCol" INTEGER NOT NULL,
    "endRow" INTEGER NOT NULL,
    "endCol" INTEGER NOT NULL,

    CONSTRAINT "MergedCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColumnWidth" (
    "sheetId" TEXT NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "widthPx" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "ColumnWidth_pkey" PRIMARY KEY ("sheetId","colIndex")
);

-- CreateTable
CREATE TABLE "RowHeight" (
    "sheetId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL DEFAULT 28,

    CONSTRAINT "RowHeight_pkey" PRIMARY KEY ("sheetId","rowIndex")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentEquipment_name_key" ON "InstrumentEquipment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_sheetId_rowIndex_colIndex_key" ON "Cell"("sheetId", "rowIndex", "colIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CellStyle_cellId_key" ON "CellStyle"("cellId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMember_userId_performanceId_position_key" ON "PerformanceMember"("userId", "performanceId", "position");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_linkedPerformanceId_fkey" FOREIGN KEY ("linkedPerformanceId") REFERENCES "Performance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSecondaryInstrument" ADD CONSTRAINT "UserSecondaryInstrument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSecondaryInstrument" ADD CONSTRAINT "UserSecondaryInstrument_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageItem" ADD CONSTRAINT "StageItem_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSchedule" ADD CONSTRAINT "PracticeSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notebook" ADD CONSTRAINT "Notebook_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellStyle" ADD CONSTRAINT "CellStyle_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "Cell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MergedCell" ADD CONSTRAINT "MergedCell_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnWidth" ADD CONSTRAINT "ColumnWidth_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RowHeight" ADD CONSTRAINT "RowHeight_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
