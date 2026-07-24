import { PrismaClient, AssignmentStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import {
  addDays,
  nextSunday,
  previousMonday,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
} from "date-fns";

const prisma = new PrismaClient();

function createQrToken(): string {
  return randomBytes(32).toString("hex");
}

const DEFAULT_WHATSAPP = {
  friday: `Bonjour,

Locataire de la Chambre {numero_chambre}, rappel : ce week-end vous êtes chargé du nettoyage de : {nom_tache}.

Merci d'effectuer cette tâche avant le {date_limite} et de la valider en scannant le QR code présent dans votre chambre.

Merci.`,
  friendly: `Bonjour,

Locataire de la Chambre {numero_chambre}, rappel : ce week-end vous êtes chargé du nettoyage de : {nom_tache}.

Merci d'effectuer cette tâche avant le {date_limite} et de la valider en scannant le QR code présent dans votre chambre.

Merci.`,
  late: `Bonjour,

Signalement retard : le nettoyage de {nom_tache}, attribué à la Chambre {numero_chambre}, n'a pas encore été validé.

Merci de régulariser la situation et de confirmer la tâche via le QR code présent dans votre chambre.`,
};

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
      "Vider la poubelle",
      "Remplacer le sac-poubelle",
      "Ranger les éléments laissés dans la cuisine",
    ],
  },
  {
    name: "Salle de bain (sans lavabo)",
    description:
      "Salle de bain sans lavabo : douche/baignoire, surfaces et sol.",
    difficulty: 4,
    checklist: [
      "Nettoyer la douche ou la baignoire",
      "Nettoyer les robinets",
      "Retirer les cheveux",
      "Nettoyer les surfaces et les murs accessibles",
      "Désinfecter la poignée de porte",
      "Désinfecter les interrupteurs",
      "Balayer le sol",
      "Laver le sol",
      "Vider la poubelle si présente",
      "Ranger les produits laissés dans la pièce",
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
      "Vider la poubelle",
      "Ranger les produits laissés dans la pièce",
    ],
  },
  {
    name: "WC indépendant (avec lavabo)",
    description:
      "WC seul avec lavabo : toilettes, lavabo, miroir et sol.",
    difficulty: 3,
    checklist: [
      "Nettoyer la cuvette",
      "Nettoyer l'abattant",
      "Nettoyer le lavabo",
      "Nettoyer le miroir",
      "Nettoyer les robinets",
      "Désinfecter la poignée de porte",
      "Désinfecter les interrupteurs",
      "Balayer le sol",
      "Laver le sol",
      "Vider la poubelle",
      "Vérifier la présence de papier toilette",
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

const DEMO_WHATSAPP = [
  "+33600000001",
  "+33600000002",
  "+33600000003",
  "+33600000004",
  "+33600000005",
  "+33600000006",
];

async function main() {
  console.log("🌱 Seed ColocClean…");

  await prisma.assignmentChecklist.deleteMany();
  await prisma.reminderLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.weeklySchedule.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.room.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("DemoOwner123!", 12);

  const owner = await prisma.user.create({
    data: {
      email: "owner@coloclean.demo",
      passwordHash,
      name: "Propriétaire Démo",
      role: UserRole.OWNER,
    },
  });

  const property = await prisma.property.create({
    data: {
      name: "Colocation Démo",
      timezone: "Europe/Paris",
      language: "fr",
      roomCount: 6,
      generationDay: 1,
      reminderDay: 5,
      deadlineDay: 0,
      deadlineTime: "18:00",
      photoRequired: false,
      primaryColor: "#0F766E",
      whatsappFridayMessage: DEFAULT_WHATSAPP.friday,
      whatsappFriendlyMessage: DEFAULT_WHATSAPP.friendly,
      whatsappLateMessage: DEFAULT_WHATSAPP.late,
    },
  });

  const rooms = await Promise.all(
    DEMO_WHATSAPP.map((phone, index) => {
      const number = index + 1;
      return prisma.room.create({
        data: {
          propertyId: property.id,
          number,
          label: `Chambre ${number}`,
          whatsappNumber: phone,
          isActive: true,
          qrToken: createQrToken(),
          qrTokenActive: true,
        },
      });
    }),
  );

  const tasks = [];
  for (let i = 0; i < TASKS.length; i++) {
    const taskDef = TASKS[i];
    const task = await prisma.task.create({
      data: {
        propertyId: property.id,
        name: taskDef.name,
        description: taskDef.description,
        difficulty: taskDef.difficulty,
        isActive: true,
        position: i + 1,
        checklistItems: {
          create: taskDef.checklist.map((label, position) => ({
            label,
            position: position + 1,
            isRequired: true,
          })),
        },
      },
      include: { checklistItems: true },
    });
    tasks.push(task);
  }

  // Planning de la semaine en cours (lundi → dimanche)
  const today = startOfDay(new Date());
  const weekStart =
    today.getDay() === 1 ? today : previousMonday(today);
  const weekEnd = nextSunday(weekStart);
  const [hours, minutes] = property.deadlineTime.split(":").map(Number);
  const deadline = setSeconds(
    setMinutes(setHours(weekEnd, hours), minutes),
    0,
  );

  const schedule = await prisma.weeklySchedule.create({
    data: {
      propertyId: property.id,
      weekStart,
      weekEnd,
      deadline,
      status: "ACTIVE",
      generatedAutomatically: true,
    },
  });

  // Rotation démo : chambre i → tâche i
  const statuses: AssignmentStatus[] = [
    AssignmentStatus.COMPLETED,
    AssignmentStatus.COMPLETED,
    AssignmentStatus.PENDING,
    AssignmentStatus.PENDING,
    AssignmentStatus.PENDING,
    AssignmentStatus.LATE,
  ];

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const task = tasks[i];
    const status = statuses[i];
    const completedAt =
      status === AssignmentStatus.COMPLETED
        ? addDays(weekStart, 5)
        : null;

    const assignment = await prisma.assignment.create({
      data: {
        weeklyScheduleId: schedule.id,
        roomId: room.id,
        taskId: task.id,
        status,
        completedAt,
        comment:
          status === AssignmentStatus.COMPLETED
            ? "Ménage effectué correctement."
            : null,
      },
    });

    if (status === AssignmentStatus.COMPLETED) {
      await prisma.assignmentChecklist.createMany({
        data: task.checklistItems.map((item) => ({
          assignmentId: assignment.id,
          checklistItemId: item.id,
          isChecked: true,
          checkedAt: completedAt,
        })),
      });
    } else {
      await prisma.assignmentChecklist.createMany({
        data: task.checklistItems.map((item) => ({
          assignmentId: assignment.id,
          checklistItemId: item.id,
          isChecked: false,
        })),
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: owner.id,
      action: "SEED_DEMO_DATA",
      entityType: "Property",
      entityId: property.id,
      metadata: { rooms: rooms.length, tasks: tasks.length },
    },
  });

  console.log("✅ Seed terminé");
  console.log("");
  console.log("Identifiants de démonstration :");
  console.log("  Email    : owner@coloclean.demo");
  console.log("  Mot de passe : DemoOwner123!");
  console.log("");
  console.log("Tokens QR (exemples) :");
  rooms.forEach((room) => {
    console.log(`  Chambre ${room.number} → /app/chambre/chambre-${room.number}/${room.qrToken}`);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
