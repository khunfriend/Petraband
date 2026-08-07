-- CreateTable
CREATE TABLE "UserPerformanceSheetPref" (
    "userId" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPerformanceSheetPref_pkey" PRIMARY KEY ("userId", "performanceId")
);

-- CreateTable
CREATE TABLE "UserSongSheetOverride" (
    "userId" TEXT NOT NULL,
    "performanceSongId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSongSheetOverride_pkey" PRIMARY KEY ("userId", "performanceSongId")
);

-- AddForeignKey
ALTER TABLE "UserPerformanceSheetPref" ADD CONSTRAINT "UserPerformanceSheetPref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPerformanceSheetPref" ADD CONSTRAINT "UserPerformanceSheetPref_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSongSheetOverride" ADD CONSTRAINT "UserSongSheetOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSongSheetOverride" ADD CONSTRAINT "UserSongSheetOverride_performanceSongId_fkey" FOREIGN KEY ("performanceSongId") REFERENCES "PerformanceSong"("id") ON DELETE CASCADE ON UPDATE CASCADE;
