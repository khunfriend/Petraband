-- AlterTable
ALTER TABLE "Song" ADD COLUMN "slug" TEXT,
ADD COLUMN "previousSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Song_slug_key" ON "Song"("slug");
