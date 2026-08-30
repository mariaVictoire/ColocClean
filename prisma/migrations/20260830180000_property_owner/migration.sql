-- AlterTable: multi-propriétaire
ALTER TABLE "Property" ADD COLUMN "ownerId" TEXT;

UPDATE "Property"
SET "ownerId" = (
  SELECT "id" FROM "User"
  WHERE "role" = 'OWNER'
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "ownerId" IS NULL;

-- Si aucun OWNER, prendre le premier user
UPDATE "Property"
SET "ownerId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "ownerId" IS NULL;

ALTER TABLE "Property" ALTER COLUMN "ownerId" SET NOT NULL;

ALTER TABLE "Property"
  ADD CONSTRAINT "Property_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
