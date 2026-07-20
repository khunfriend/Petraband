-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('MEMBER', 'HEAD', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"::text
    WHEN 'SECTION_LEAD' THEN 'HEAD'
    ELSE "role"::text
  END
)::"Role_new";
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- CreateTable
CREATE TABLE "PerformanceHead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceHead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceHead_userId_performanceId_key" ON "PerformanceHead"("userId", "performanceId");

-- AddForeignKey
ALTER TABLE "PerformanceHead" ADD CONSTRAINT "PerformanceHead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceHead" ADD CONSTRAINT "PerformanceHead_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
