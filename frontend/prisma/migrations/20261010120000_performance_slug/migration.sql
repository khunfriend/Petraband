-- AlterTable
ALTER TABLE "Performance" ADD COLUMN "slug" TEXT,
ADD COLUMN "previousSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Performance_slug_key" ON "Performance"("slug");
