/**
 * Met à jour les 6 tâches (noms + checklists) sans toucher aux QR / comptes.
 * Usage : npx tsx scripts/update-tasks.ts
 */
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
      "Nettoyer l'évier",
      "Nettoyer le plan de travail",
      "Nettoyer la plaque de cuisson",
      "Nettoyer le micro-ondes",
      "Nettoyer la table",
      "Balayer le sol",
      "Laver le sol",
    ],
  },
  {
    name: "Salle de bain (sans lavabo)",
    description:
      "Salle de bain sans lavabo : douche, surfaces et sol.",
    difficulty: 4,
    checklist: [
      "Nettoyer la douche",
      "Nettoyer les robinets",
      "Nettoyer les surfaces et les murs accessibles",
      "Essuyer poignée et interrupteur",
    ],
  },
  {
    name: "Salle de bain avec WC",
    description:
      "Salle de bain équipée d'un WC : nettoyage de la pièce et des toilettes.",
    difficulty: 5,
    checklist: [
      "Nettoyer le lavabo",
      "Nettoyer le miroir",
      "Nettoyer la douche ou la baignoire",
      "Nettoyer les robinets",
      "Retirer les cheveux",
      "Nettoyer la cuvette des WC",
      "Nettoyer l'abattant et le tour des WC",
      "Vérifier le papier toilette",
      "Nettoyer les surfaces",
      "Balayer le sol",
      "Laver le sol",
    ],
  },
  {
    name: "WC indépendant (avec lavabo)",
    description: "WC seul avec lavabo : toilettes, lavabo, miroir et sol.",
    difficulty: 3,
    checklist: [
      "Nettoyer la cuvette",
      "Nettoyer l'abattant",
      "Nettoyer le lavabo",
      "Nettoyer le miroir",
      "Nettoyer les robinets",
      "Balayer le sol",
      "Laver le sol",
    ],
  },
  {
    name: "Couloir et espaces communs",
    description: "Entretien du couloir et des espaces communs.",
    difficulty: 3,
    checklist: [
      "Ranger les objets laissés au sol",
      "Dépoussiérer les surfaces",
      "Nettoyer les poignées",
      "Nettoyer les interrupteurs",
      "Balayer le sol",
      "Laver le sol",
      "Remettre l'espace en ordre",
    ],
  },
  {
    name: "Poubelles",
    description: "Gestion des poubelles communes.",
    difficulty: 2,
    checklist: [
      "Vider les poubelles communes",
      "Sortir les sacs",
      "Remplacer les sacs",
      "Vérifier qu'aucun sac ne reste dans les parties communes",
      "Nettoyer les bacs si nécessaire",
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
        checklistItems: {
          create: def.checklist.map((label, position) => ({
            label,
            position: position + 1,
            isRequired: true,
          })),
        },
      },
    });

    // Recréer les lignes checklist pour les assignments non terminés de cette tâche
    const openAssignments = await prisma.assignment.findMany({
      where: {
        taskId: task.id,
        status: { in: ["PENDING", "LATE", "UPCOMING"] },
      },
      include: { task: { include: { checklistItems: true } } },
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
