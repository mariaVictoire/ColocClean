import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { appConfig } from "@/config/app";
import { requireOwner } from "@/lib/auth-helpers";

const ACTIVE_PROPERTY_COOKIE = `${appConfig.slug}.active-property`;

export function activePropertyCookieName() {
  return ACTIVE_PROPERTY_COOKIE;
}

export async function listOwnedProperties(ownerId: string) {
  return prisma.property.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
  });
}

/** Propriété active de l'owner connecté (cookie ou première). */
export async function getActiveOwnedProperty() {
  const session = await requireOwner();
  const owned = await listOwnedProperties(session.user.id);
  if (owned.length === 0) {
    throw new Error("Aucune colocation. Créez-en une pour commencer.");
  }

  const jar = await cookies();
  const preferred = jar.get(ACTIVE_PROPERTY_COOKIE)?.value;
  const active =
    (preferred ? owned.find((p) => p.id === preferred) : null) ?? owned[0];

  return { session, property: active, properties: owned };
}

/** @deprecated Utiliser getActiveOwnedProperty */
export async function getDefaultProperty() {
  const { property } = await getActiveOwnedProperty();
  return property;
}

export async function getDefaultPropertyId() {
  const property = await getDefaultProperty();
  return property.id;
}

export async function assertRoomOwnedBySession(roomId: string) {
  const { session, property } = await getActiveOwnedProperty();
  const room = await prisma.room.findFirst({
    where: { id: roomId, propertyId: property.id },
  });
  if (!room) {
    throw new Error("Chambre introuvable pour cette colocation.");
  }
  return { session, property, room };
}

export async function assertTaskOwnedBySession(taskId: string) {
  const { session, property } = await getActiveOwnedProperty();
  const task = await prisma.task.findFirst({
    where: { id: taskId, propertyId: property.id },
  });
  if (!task) {
    throw new Error("Tâche introuvable pour cette colocation.");
  }
  return { session, property, task };
}

export async function assertAssignmentOwnedBySession(assignmentId: string) {
  const { session, property } = await getActiveOwnedProperty();
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      weeklySchedule: { propertyId: property.id },
    },
  });
  if (!assignment) {
    throw new Error("Assignation introuvable pour cette colocation.");
  }
  return { session, property, assignment };
}

export { createPropertyForOwner } from "@/lib/property-setup";
