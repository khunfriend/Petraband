-- AlterTable
ALTER TABLE "CellStyle" ADD COLUMN     "borderBottom" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "borderLeft" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "borderRight" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "borderTop" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "verticalAlign" TEXT NOT NULL DEFAULT 'middle',
ADD COLUMN     "wrapText" BOOLEAN NOT NULL DEFAULT false;

