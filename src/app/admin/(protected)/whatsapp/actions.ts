"use server";

import { ReminderType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function prepareReminder(
  assignmentId: string,
  type: ReminderType,
) {
  await requireOwner();
  const log = await prisma.reminderLog.create({
    data: {
      assignmentId,
      type,
      preparedAt: new Date(),
    },
  });
  revalidatePath("/admin/whatsapp");
  revalidatePath("/admin/historique");
  return { id: log.id };
}

export async function markReminderSent(reminderId: string) {
  await requireOwner();
  await prisma.reminderLog.update({
    where: { id: reminderId },
    data: { markedAsSentAt: new Date() },
  });
  revalidatePath("/admin/whatsapp");
  revalidatePath("/admin/historique");
  return { ok: true as const };
}
