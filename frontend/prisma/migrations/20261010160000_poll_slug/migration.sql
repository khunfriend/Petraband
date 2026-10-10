-- AlterTable
ALTER TABLE "AvailabilityPoll" ADD COLUMN "slug" TEXT,
ADD COLUMN "previousSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityPoll_slug_key" ON "AvailabilityPoll"("slug");
