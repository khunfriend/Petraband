-- Extend AccountStatus enum
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'PENDING_EMAIL';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- Add fields to User for Supabase Auth linkage + approval workflow
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "supabaseUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- Mark all existing users as email-verified (grandfathered)
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

-- PendingRegistration: holds signup data between /register and /auth/callback
CREATE TABLE IF NOT EXISTS "PendingRegistration" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "generation" TEXT NOT NULL DEFAULT '',
  "primaryInstrumentId" TEXT,
  "supabaseUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PendingRegistration_email_key" ON "PendingRegistration"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "PendingRegistration_supabaseUserId_key" ON "PendingRegistration"("supabaseUserId");
CREATE INDEX IF NOT EXISTS "PendingRegistration_createdAt_idx" ON "PendingRegistration"("createdAt");
