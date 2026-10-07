ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twoFaBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sessionInvalidatedAt" TIMESTAMP(3);
CREATE TABLE IF NOT EXISTS "login_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'login_events_userId_fkey') THEN
    ALTER TABLE "login_events" ADD CONSTRAINT "login_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
