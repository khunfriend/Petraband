-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "AvailabilityPoll" DROP CONSTRAINT "AvailabilityPoll_createdById_fkey";

-- DropForeignKey
ALTER TABLE "PracticeSchedule" DROP CONSTRAINT "PracticeSchedule_createdById_fkey";

-- DropForeignKey
ALTER TABLE "RehearsalAttendance" DROP CONSTRAINT "RehearsalAttendance_userId_fkey";

-- DropForeignKey
ALTER TABLE "Rsvp" DROP CONSTRAINT "Rsvp_userId_fkey";

-- DropForeignKey
ALTER TABLE "SongAssignment" DROP CONSTRAINT "SongAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "SongVersion" DROP CONSTRAINT "SongVersion_createdById_fkey";

-- DropForeignKey
ALTER TABLE "StageLayoutVersion" DROP CONSTRAINT "StageLayoutVersion_createdById_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "userName" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AvailabilityPoll" ADD COLUMN     "createdByName" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PracticeSchedule" ADD COLUMN     "createdByName" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SongVersion" ADD COLUMN     "createdByName" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StageLayoutVersion" ADD COLUMN     "createdByName" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SongVersion" ADD CONSTRAINT "SongVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongAssignment" ADD CONSTRAINT "SongAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageLayoutVersion" ADD CONSTRAINT "StageLayoutVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalAttendance" ADD CONSTRAINT "RehearsalAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSchedule" ADD CONSTRAINT "PracticeSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityPoll" ADD CONSTRAINT "AvailabilityPoll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill the name snapshots from the accounts that still exist, so history
-- stays readable once those accounts are deleted and the FK goes null.
UPDATE "SongVersion" v SET "createdByName" = u."nickname"
  FROM "User" u WHERE v."createdById" = u."id" AND v."createdByName" = '';

UPDATE "StageLayoutVersion" v SET "createdByName" = u."nickname"
  FROM "User" u WHERE v."createdById" = u."id" AND v."createdByName" = '';

UPDATE "PracticeSchedule" s SET "createdByName" = u."nickname"
  FROM "User" u WHERE s."createdById" = u."id" AND s."createdByName" = '';

UPDATE "AvailabilityPoll" p SET "createdByName" = u."nickname"
  FROM "User" u WHERE p."createdById" = u."id" AND p."createdByName" = '';

UPDATE "AuditLog" a SET "userName" = u."nickname"
  FROM "User" u WHERE a."userId" = u."id" AND a."userName" = '';
