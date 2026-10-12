-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'LATE';

-- AlterTable
ALTER TABLE "PracticeDay" ADD COLUMN "attendanceOpenedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PracticeAttendance" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAttendance_dayId_userId_key" ON "PracticeAttendance"("dayId", "userId");

-- AddForeignKey
ALTER TABLE "PracticeAttendance" ADD CONSTRAINT "PracticeAttendance_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "PracticeDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAttendance" ADD CONSTRAINT "PracticeAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
