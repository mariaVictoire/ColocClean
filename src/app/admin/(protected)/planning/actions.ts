"use server";

import { revalidatePath } from "next/cache";
import { AssignmentStatus } from "@prisma/client";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  assertAssignmentOwnedBySession,
  getActiveOwnedProperty,
} from "@/lib/property";
import {
  generateScheduleForProperty,
  markLateAssignments,
  weekBoundsFor,
} from "@/lib/scheduling/schedule";

export async function generateCurrentWeekSchedule() {
  await requireOwner();
  const { property } = await getActiveOwnedProperty();
  const { weekStart } = weekBoundsFor(new Date());
  const result = await generateScheduleForProperty(property.id, {
    weekStart,
    force: false,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/planning");
  revalidatePath("/admin/whatsapp");
  return result.created
    ? { ok: true as const, message: "Planning généré." }
    : {
        ok: true as const,
        message: "Le planning de cette semaine existe déjà.",
      };
}

export async function regenerateCurrentWeekSchedule() {
  await requireOwner();
  const { property } = await getActiveOwnedProperty();
  const { weekStart } = weekBoundsFor(new Date());
  await generateScheduleForProperty(property.id, {
    weekStart,
    force: true,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/planning");
  revalidatePath("/admin/whatsapp");
  return { ok: true as const, message: "Planning régénéré." };
}

export async function markAssignmentStatus(
  assignmentId: string,
  status: "EXCUSED" | "PENDING" | "COMPLETED" | "LATE",
) {
  await requireOwner();
  await assertAssignmentOwnedBySession(assignmentId);
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: status as AssignmentStatus,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/planning");
  revalidatePath("/admin/historique");
  return { ok: true as const };
}

export async function runMarkLateNow() {
  await requireOwner();
  const { property } = await getActiveOwnedProperty();
  const count = await markLateAssignments(property.id);
  revalidatePath("/admin");
  revalidatePath("/admin/planning");
  return { ok: true as const, count };
}
