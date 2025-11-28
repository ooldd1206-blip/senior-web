-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL,
ALTER COLUMN "displayName" DROP NOT NULL;
