-- PollStatus enum
DO $$ BEGIN
  CREATE TYPE "PollStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AvailabilityPoll
CREATE TABLE IF NOT EXISTS "AvailabilityPoll" (
  "id" TEXT NOT NULL,
  "performanceId" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'โพลตารางว่าง',
  "deadline" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  "status" "PollStatus" NOT NULL DEFAULT 'OPEN',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvailabilityPoll_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvailabilityPoll_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AvailabilityPoll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AvailabilityPoll_performanceId_idx" ON "AvailabilityPoll"("performanceId");

-- AvailabilityPollSlot
CREATE TABLE IF NOT EXISTS "AvailabilityPollSlot" (
  "id" TEXT NOT NULL,
  "pollId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "slotOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AvailabilityPollSlot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvailabilityPollSlot_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "AvailabilityPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AvailabilityPollSlot_pollId_idx" ON "AvailabilityPollSlot"("pollId");

-- AvailabilityPollResponse
CREATE TABLE IF NOT EXISTS "AvailabilityPollResponse" (
  "id" TEXT NOT NULL,
  "pollSlotId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvailabilityPollResponse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvailabilityPollResponse_pollSlotId_fkey" FOREIGN KEY ("pollSlotId") REFERENCES "AvailabilityPollSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AvailabilityPollResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilityPollResponse_pollSlotId_userId_key" ON "AvailabilityPollResponse"("pollSlotId", "userId");
CREATE INDEX IF NOT EXISTS "AvailabilityPollResponse_userId_idx" ON "AvailabilityPollResponse"("userId");

-- Link PracticeSchedule → sourcePoll (optional)
ALTER TABLE "PracticeSchedule" ADD COLUMN IF NOT EXISTS "sourcePollId" TEXT;
DO $$ BEGIN
  ALTER TABLE "PracticeSchedule"
    ADD CONSTRAINT "PracticeSchedule_sourcePollId_fkey"
    FOREIGN KEY ("sourcePollId") REFERENCES "AvailabilityPoll"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
