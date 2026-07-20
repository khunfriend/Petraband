-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'SECTION_LEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PENDING');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('GOOD', 'FAIR', 'NEEDS_REPAIR', 'RETIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "generation" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "primaryInstrumentId" TEXT,
    "secondaryInstrumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameThai" TEXT NOT NULL,
    "allowsConcurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "songCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ดนตรีไทย',
    "duration" INTEGER,
    "sheetData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Performance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceDate" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "PerformanceDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSong" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PerformanceSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performanceDateId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongAssignment" (
    "id" TEXT NOT NULL,
    "performanceSongId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageLayout" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 10,
    "height" INTEGER NOT NULL DEFAULT 5,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageLayoutVersion" (
    "id" TEXT NOT NULL,
    "stageLayoutId" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageLayoutVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageItem" (
    "id" TEXT NOT NULL,
    "stageLayoutId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "w" INTEGER NOT NULL DEFAULT 1,
    "h" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,

    CONSTRAINT "StageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "layoutJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rehearsal" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rehearsal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RehearsalAttendance" (
    "id" TEXT NOT NULL,
    "rehearsalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "note" TEXT,

    CONSTRAINT "RehearsalAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" "EquipmentCondition" NOT NULL DEFAULT 'GOOD',
    "lengthCm" DOUBLE PRECISION,
    "widthCm" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_name_key" ON "Instrument"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Song_songCode_key" ON "Song"("songCode");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceSong_performanceId_songId_key" ON "PerformanceSong"("performanceId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "Rsvp_userId_performanceDateId_key" ON "Rsvp"("userId", "performanceDateId");

-- CreateIndex
CREATE UNIQUE INDEX "SongAssignment_performanceSongId_userId_key" ON "SongAssignment"("performanceSongId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RehearsalAttendance_rehearsalId_userId_key" ON "RehearsalAttendance"("rehearsalId", "userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryInstrumentId_fkey" FOREIGN KEY ("primaryInstrumentId") REFERENCES "Instrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_secondaryInstrumentId_fkey" FOREIGN KEY ("secondaryInstrumentId") REFERENCES "Instrument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceDate" ADD CONSTRAINT "PerformanceDate_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSong" ADD CONSTRAINT "PerformanceSong_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSong" ADD CONSTRAINT "PerformanceSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_performanceDateId_fkey" FOREIGN KEY ("performanceDateId") REFERENCES "PerformanceDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongAssignment" ADD CONSTRAINT "SongAssignment_performanceSongId_fkey" FOREIGN KEY ("performanceSongId") REFERENCES "PerformanceSong"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongAssignment" ADD CONSTRAINT "SongAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongAssignment" ADD CONSTRAINT "SongAssignment_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageLayout" ADD CONSTRAINT "StageLayout_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageLayoutVersion" ADD CONSTRAINT "StageLayoutVersion_stageLayoutId_fkey" FOREIGN KEY ("stageLayoutId") REFERENCES "StageLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageLayoutVersion" ADD CONSTRAINT "StageLayoutVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageItem" ADD CONSTRAINT "StageItem_stageLayoutId_fkey" FOREIGN KEY ("stageLayoutId") REFERENCES "StageLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageItem" ADD CONSTRAINT "StageItem_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalAttendance" ADD CONSTRAINT "RehearsalAttendance_rehearsalId_fkey" FOREIGN KEY ("rehearsalId") REFERENCES "Rehearsal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalAttendance" ADD CONSTRAINT "RehearsalAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
