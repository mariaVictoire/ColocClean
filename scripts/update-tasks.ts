/**
 * Met à jour les 6 tâches (noms + checklists) selon le planning papier.
 * Usage : npx tsx scripts/update-tasks.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TASKS: Array<{
  name: string;
  description: string;
  difficulty: number;
  checklist: string[];
}> = [
  {
    name: "Cuisine",
    description: "Nettoyage complet de la cuisine commune.",
    difficulty: 4,
    checklist: [
      "Nettoyer le plan de travail",
      "Nettoyer l'évier",
      "Nettoyer le sol",
      "Vider / nettoyer la poubelle de cuisine",
      "Nettoyer le micro-ondes",
      "Nettoyer le four",
    ],
  },
  {
    name: "Salle de bain 1",
    description:
      "Salle de bain 1 (filles) : lavabo, douche, miroir et sol. Associée au WC 1.",
    difficulty: 4,
    checklist: [
      "Nettoyer le lavabo",
      "Nettoyer la douche",
      "Nettoyer le miroir",
      "Nettoyer le sol",
    ],
  },
  {
    name: "Salle de bain 2",
    description: "Salle de bain 2 : lavabo, douche, miroir et sol.",
    difficulty: 4,
    checklist: [
      "Nettoyer le lavabo",
      "Nettoyer la douche",
      "Nettoyer le miroir",
      "Nettoyer le sol",
    ],
  },
  {
    name: "WC 1",
    description:
      "WC 1 (filles) : cuvette, lavabo, sol et miroir. Associé à la salle de bain 1.",
    difficulty: 3,
    checklist: [
      "Nettoyer la cuvette",
      "Nettoyer le lavabo",
      "Nettoyer le sol",
      "Nettoyer le miroir",
    ],
  },
  {
    name: "Espace commun",
    description: "Couloir, escalier et entrée : aspirateur, serpillère, dépoussiérage.",
    difficulty: 3,
    checklist: [
      "Passer l'aspirateur",
      "Passer la serpillère",
      "Dépoussiérer les surfaces",
      "Remettre l'espace en ordre",
    ],
  },
  {
    name: "Poubelles",
    description: "Vider les poubelles dès que possible.",
    difficulty: 2,
    checklist: [
      "Vider les poubelles communes",
      "Sortir les sacs",
      "Remplacer les sacs",
      "Vérifier qu'aucun sac ne reste dans les parties communes",
    ],
  },
];

async function main() {
  const property = await prisma.property.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!property) {
    throw new Error("Aucune propriété");
  }

  const tasks = await prisma.task.findMany({
    where: { propertyId: property.id },
    orderBy: { position: "asc" },
  });

  if (tasks.length !== TASKS.length) {
    throw new Error(
      `Attendu ${TASKS.length} tâches, trouvé ${tasks.length}. Relance un seed complet.`,
    );
  }

  for (let i = 0; i < tasks.length; i++) {
    const def = TASKS[i];
    const task = tasks[i];

    await prisma.assignmentChecklist.deleteMany({
      where: { checklistItem: { taskId: task.id } },
    });
    await prisma.checklistItem.deleteMany({ where: { taskId: task.id } });

    await prisma.task.update({
      where: { id: task.id },
      data: {
        name: def.name,
        description: def.description,
        difficulty: def.difficulty,
        position: i + 1,
        checklistItems: {
          create: def.checklist.map((label, position) => ({
            label,
            position: position + 1,
            isRequired: true,
          })),
        },
      },
    });

    const openAssignments = await prisma.assignment.findMany({
      where: {
        taskId: task.id,
        status: { in: ["PENDING", "LATE", "UPCOMING"] },
      },
    });

    for (const assignment of openAssignments) {
      const items = await prisma.checklistItem.findMany({
        where: { taskId: task.id },
      });
      if (items.length === 0) continue;
      await prisma.assignmentChecklist.createMany({
        data: items.map((item) => ({
          assignmentId: assignment.id,
          checklistItemId: item.id,
          isChecked: false,
        })),
      });
    }

    console.log(`✔ ${def.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
