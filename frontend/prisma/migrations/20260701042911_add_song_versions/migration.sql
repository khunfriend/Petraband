-- CreateTable
CREATE TABLE "SongVersion" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "sheetData" JSONB,
    "duration" INTEGER,
    "message" TEXT NOT NULL DEFAULT 'แก้ไขโน้ต',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SongVersion" ADD CONSTRAINT "SongVersion_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongVersion" ADD CONSTRAINT "SongVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
