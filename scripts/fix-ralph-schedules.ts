/**
 * Régénère les plannings Ralph en mode BALANCED (1 tâche / chambre).
 * Usage : npx tsx scripts/fix-ralph-schedules.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  generateScheduleForProperty,
  weekBoundsFor,
} from "../src/lib/scheduling/schedule";

const prisma = new PrismaClient();

async function main() {
  const ralph = await prisma.user.findUnique({
    where: { email: "ralph@coloclean.com" },
  });
  if (!ralph) throw new Error("Ralph introuvable");

  await prisma.property.updateMany({
    where: { ownerId: ralph.id },
    data: { rotationMode: "BALANCED" },
  });

  const props = await prisma.property.findMany({
    where: { ownerId: ralph.id },
    orderBy: { createdAt: "asc" },
  });

  const { weekStart } = weekBoundsFor(new Date());

  for (const prop of props) {
    await generateScheduleForProperty(prop.id, {
      weekStart,
      force: true,
    });

    const schedule = await prisma.weeklySchedule.findUnique({
      where: {
        propertyId_weekStart: { propertyId: prop.id, weekStart },
      },
      include: {
        assignments: {
          include: { room: true, task: true },
          orderBy: { room: { number: "asc" } },
        },
      },
    });

    console.log(`\n✔ ${prop.name} (${prop.rotationMode})`);
    const byRoom = new Map<number, string[]>();
    for (const a of schedule?.assignments ?? []) {
      const list = byRoom.get(a.room.number) ?? [];
      list.push(a.task.name);
      byRoom.set(a.room.number, list);
    }
    for (const n of [...byRoom.keys()].sort((a, b) => a - b)) {
      const tasks = byRoom.get(n)!;
      const mark = tasks.length === 1 ? "OK" : `⚠ ${tasks.length} tâches`;
      console.log(`  C${n} [${mark}] → ${tasks.join(" + ")}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
