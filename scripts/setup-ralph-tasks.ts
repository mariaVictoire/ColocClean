/**
 * Configure les colocations de Ralph :
 * - rotation BALANCED (1 tâche / chambre)
 * - tâches : cuisine, SDB1+WC, SDB2, WC indépendant, balcon, couloir
 * Arnold reste en mode PAPER.
 *
 * Usage : npx tsx scripts/setup-ralph-tasks.ts
 */
import "dotenv/config";
import { PrismaClient, RotationMode } from "@prisma/client";
import { BALANCED_TASK_DEFS } from "../src/lib/property-defaults";

const prisma = new PrismaClient();

async function replaceTasks(propertyId: string) {
  // Supprimer plannings (cascade assignments) pour pouvoir remplacer les tâches
  await prisma.weeklySchedule.deleteMany({ where: { propertyId } });
  await prisma.task.deleteMany({ where: { propertyId } });

  for (let i = 0; i < BALANCED_TASK_DEFS.length; i++) {
    const def = BALANCED_TASK_DEFS[i];
    await prisma.task.create({
      data: {
        propertyId,
        name: def.name,
        description: def.description,
        difficulty: def.difficulty,
        position: i + 1,
        isActive: true,
        checklistItems: {
          create: def.checklist.map((label, position) => ({
            label,
            position: position + 1,
            isRequired: true,
          })),
        },
      },
    });
  }
}

async function main() {
  const arnold = await prisma.user.findUnique({
    where: { email: "arnold@coloclean.com" },
  });
  if (arnold) {
    const r = await prisma.property.updateMany({
      where: { ownerId: arnold.id },
      data: { rotationMode: RotationMode.PAPER },
    });
    console.log(`✔ Arnold → PAPER (${r.count} coloc)`);
  }

  const ralph = await prisma.user.findUnique({
    where: { email: "ralph@coloclean.com" },
  });
  if (!ralph) {
    console.warn("⚠ Ralph introuvable");
    return;
  }

  const props = await prisma.property.findMany({
    where: { ownerId: ralph.id },
    orderBy: { createdAt: "asc" },
  });

  for (const p of props) {
    await prisma.property.update({
      where: { id: p.id },
      data: { rotationMode: RotationMode.BALANCED },
    });
    await replaceTasks(p.id);
    console.log(`✔ ${p.name} → BALANCED + 6 tâches Ralph`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
