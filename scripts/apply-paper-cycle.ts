/**
 * Ancre le cycle papier (semaine 1 = lundi précédent si on est en semaine 2)
 * et régénère le planning de la semaine courante.
 *
 * Usage : npx tsx scripts/apply-paper-cycle.ts
 */
import "dotenv/config";
import { addDays, format, startOfDay } from "date-fns";
import { PrismaClient } from "@prisma/client";
import { toDateOnlyUTC } from "../src/lib/scheduling/fixed-cycle";
import {
  generateScheduleForProperty,
  weekBoundsFor,
} from "../src/lib/scheduling/schedule";

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!property) throw new Error("Aucune propriété");

  const { weekStart } = weekBoundsFor(new Date());
  // Cette semaine = semaine 2 du papier → ancre = lundi de la semaine 1
  const anchorLocal = startOfDay(addDays(weekStart, -7));
  const anchor = toDateOnlyUTC(anchorLocal);

  await prisma.property.update({
    where: { id: property.id },
    data: { cycleAnchorWeekStart: anchor },
  });

  console.log(
    `Ancre semaine 1 : ${format(anchorLocal, "yyyy-MM-dd")} (cette semaine = S2, lundi ${format(weekStart, "yyyy-MM-dd")})`,
  );

  // Nettoie d'éventuels doublons de semaine (décalage UTC)
  await prisma.weeklySchedule.deleteMany({
    where: {
      propertyId: property.id,
      weekStart: {
        gte: addDays(weekStart, -2),
        lte: addDays(weekStart, 2),
      },
    },
  });

  const result = await generateScheduleForProperty(property.id, {
    weekStart,
    force: true,
  });

  const schedule = await prisma.weeklySchedule.findUniqueOrThrow({
    where: { id: result.schedule.id },
    include: {
      assignments: {
        include: { room: true, task: true },
        orderBy: [{ room: { number: "asc" } }, { task: { position: "asc" } }],
      },
    },
  });

  console.log("Planning semaine courante (doit = papier S2) :");
  for (const a of schedule.assignments) {
    console.log(`  C${a.room.number} → ${a.task.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
