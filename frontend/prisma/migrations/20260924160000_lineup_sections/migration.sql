-- Optional sections (sets / ensembles) inside a performance's lineup.
CREATE TABLE "LineupSection" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LineupSection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LineupSection_performanceId_idx" ON "LineupSection"("performanceId");
ALTER TABLE "LineupSection" ADD CONSTRAINT "LineupSection_performanceId_fkey"
    FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing rows all belong to the single, unsectioned lineup ("").
ALTER TABLE "PerformanceMember" ADD COLUMN "sectionId" TEXT NOT NULL DEFAULT '';

-- The same person may now hold a position in each section.
DROP INDEX "PerformanceMember_userId_performanceId_position_key";
CREATE UNIQUE INDEX "PerformanceMember_userId_performanceId_sectionId_position_key"
    ON "PerformanceMember"("userId", "performanceId", "sectionId", "position");
