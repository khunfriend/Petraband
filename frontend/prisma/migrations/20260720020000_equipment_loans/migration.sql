-- CreateEnum
CREATE TYPE "LoanDirection" AS ENUM ('BORROWED_IN', 'LENT_OUT');

-- CreateTable
CREATE TABLE "EquipmentLoan" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "direction" "LoanDirection" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "counterparty" TEXT NOT NULL,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentLoan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentLoan_equipmentId_returnedAt_idx" ON "EquipmentLoan"("equipmentId", "returnedAt");

-- CreateIndex
CREATE INDEX "EquipmentLoan_direction_returnedAt_idx" ON "EquipmentLoan"("direction", "returnedAt");

-- AddForeignKey
ALTER TABLE "EquipmentLoan" ADD CONSTRAINT "EquipmentLoan_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
