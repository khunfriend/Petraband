-- CreateTable
CREATE TABLE "RowNote" (
    "sheetId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "leftText" TEXT NOT NULL DEFAULT '',
    "rightText" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "RowNote_pkey" PRIMARY KEY ("sheetId","rowIndex")
);

-- AddForeignKey
ALTER TABLE "RowNote" ADD CONSTRAINT "RowNote_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
