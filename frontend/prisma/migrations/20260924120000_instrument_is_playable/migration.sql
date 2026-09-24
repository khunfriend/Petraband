-- Stage equipment lives in the same library as instruments but is not
-- something a member plays. Existing rows are all instruments.
ALTER TABLE "Instrument" ADD COLUMN "isPlayable" BOOLEAN NOT NULL DEFAULT true;
