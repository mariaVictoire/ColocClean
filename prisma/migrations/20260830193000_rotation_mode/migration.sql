-- CreateEnum
CREATE TYPE "RotationMode" AS ENUM ('PAPER', 'BALANCED');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "rotationMode" "RotationMode" NOT NULL DEFAULT 'BALANCED';
