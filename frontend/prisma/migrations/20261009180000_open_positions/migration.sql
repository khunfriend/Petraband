-- CreateTable
CREATE TABLE "OpenPosition" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpenPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpenPosition_performanceId_sectionId_position_key" ON "OpenPosition"("performanceId", "sectionId", "position");

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
