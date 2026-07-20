-- CreateTable PracticeSchedule
CREATE TABLE "PracticeSchedule" (
    "id" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'ตารางซ้อม',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable PracticeDay
CREATE TABLE "PracticeDay" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dayOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PracticeDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable PracticeSlot
CREATE TABLE "PracticeSlot" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "slotOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PracticeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable PracticeMemberGroup
CREATE TABLE "PracticeMemberGroup" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PracticeMemberGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable PracticeGroupMember
CREATE TABLE "PracticeGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PracticeGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable PracticeAvailability
CREATE TABLE "PracticeAvailability" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeGroupMember_groupId_userId_key" ON "PracticeGroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAvailability_slotId_userId_key" ON "PracticeAvailability"("slotId", "userId");

-- AddForeignKey
ALTER TABLE "PracticeSchedule" ADD CONSTRAINT "PracticeSchedule_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSchedule" ADD CONSTRAINT "PracticeSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeDay" ADD CONSTRAINT "PracticeDay_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PracticeSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSlot" ADD CONSTRAINT "PracticeSlot_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "PracticeDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeMemberGroup" ADD CONSTRAINT "PracticeMemberGroup_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PracticeSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeGroupMember" ADD CONSTRAINT "PracticeGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PracticeMemberGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeGroupMember" ADD CONSTRAINT "PracticeGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAvailability" ADD CONSTRAINT "PracticeAvailability_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "PracticeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAvailability" ADD CONSTRAINT "PracticeAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
