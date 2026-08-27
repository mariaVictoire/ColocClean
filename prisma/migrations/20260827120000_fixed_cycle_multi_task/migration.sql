-- AlterTable
ALTER TABLE "Property" ADD COLUMN "cycleAnchorWeekStart" DATE;

-- DropIndex / Drop unique room-per-week (une chambre peut avoir plusieurs tâches)
DROP INDEX IF EXISTS "Assignment_weeklyScheduleId_roomId_key";

CREATE INDEX "Assignment_weeklyScheduleId_roomId_idx" ON "Assignment"("weeklyScheduleId", "roomId");
