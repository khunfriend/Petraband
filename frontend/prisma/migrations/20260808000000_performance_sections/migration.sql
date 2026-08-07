-- CreateTable
CREATE TABLE "PerformanceSection" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceSection_performanceId_sectionOrder_idx" ON "PerformanceSection"("performanceId", "sectionOrder");

-- AlterTable
ALTER TABLE "PerformanceSong" ADD COLUMN "sectionId" TEXT;
ALTER TABLE "PerformanceSong" ADD COLUMN "orderInSection" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PerformanceSong_sectionId_orderInSection_idx" ON "PerformanceSong"("sectionId", "orderInSection");

-- AddForeignKey
ALTER TABLE "PerformanceSection" ADD CONSTRAINT "PerformanceSection_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSong" ADD CONSTRAINT "PerformanceSong_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PerformanceSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
