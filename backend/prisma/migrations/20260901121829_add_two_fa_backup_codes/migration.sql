-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFaBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
