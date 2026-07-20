-- CreateTable
CREATE TABLE "PerformanceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performanceId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMember_userId_performanceId_key" ON "PerformanceMember"("userId", "performanceId");

-- AddForeignKey
ALTER TABLE "PerformanceMember" ADD CONSTRAINT "PerformanceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMember" ADD CONSTRAINT "PerformanceMember_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "Performance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
