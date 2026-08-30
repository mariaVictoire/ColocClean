import { prisma } from "@/lib/db";
import {
  createQrToken,
  DEFAULT_TASK_DEFS,
  DEFAULT_WHATSAPP_TEMPLATES,
} from "@/lib/property-defaults";
import { weekBoundsFor } from "@/lib/scheduling/schedule";

/** Crée une colocation complète : 6 chambres + 6 tâches (sans planning). */
export async function createPropertyForOwner(
  ownerId: string,
  name: string,
  roomCount = 6,
) {
  const { weekStart } = weekBoundsFor(new Date());

  return prisma.$transaction(async (tx) => {
    const property = await tx.property.create({
      data: {
        name,
        ownerId,
        roomCount,
        cycleAnchorWeekStart: weekStart,
        whatsappFridayMessage: DEFAULT_WHATSAPP_TEMPLATES.friday,
        whatsappFriendlyMessage: DEFAULT_WHATSAPP_TEMPLATES.friendly,
        whatsappLateMessage: DEFAULT_WHATSAPP_TEMPLATES.late,
      },
    });

    for (let n = 1; n <= roomCount; n++) {
      await tx.room.create({
        data: {
          propertyId: property.id,
          number: n,
          label: `Chambre ${n}`,
          isActive: true,
          qrToken: createQrToken(),
          qrTokenActive: true,
        },
      });
    }

    for (let i = 0; i < DEFAULT_TASK_DEFS.length; i++) {
      const def = DEFAULT_TASK_DEFS[i];
      await tx.task.create({
        data: {
          propertyId: property.id,
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

    return property;
  });
}
