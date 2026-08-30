import { prisma } from "@/lib/db";
import {
  BALANCED_TASK_DEFS,
  createQrToken,
  DEFAULT_WHATSAPP_TEMPLATES,
  type TaskDef,
} from "@/lib/property-defaults";
import { weekBoundsFor } from "@/lib/scheduling/schedule";
import { RotationMode } from "@prisma/client";

/** Crée une colocation complète : 6 chambres + 6 tâches (sans planning). */
export async function createPropertyForOwner(
  ownerId: string,
  name: string,
  roomCount = 6,
  options?: {
    taskDefs?: TaskDef[];
    rotationMode?: RotationMode;
  },
) {
  const { weekStart } = weekBoundsFor(new Date());
  const taskDefs = options?.taskDefs ?? BALANCED_TASK_DEFS;
  const rotationMode = options?.rotationMode ?? RotationMode.BALANCED;

  return prisma.$transaction(async (tx) => {
    const property = await tx.property.create({
      data: {
        name,
        ownerId,
        roomCount,
        cycleAnchorWeekStart: weekStart,
        rotationMode,
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

    for (let i = 0; i < taskDefs.length; i++) {
      const def = taskDefs[i];
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
