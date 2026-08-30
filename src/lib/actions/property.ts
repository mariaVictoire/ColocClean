"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  activePropertyCookieName,
  createPropertyForOwner,
  getActiveOwnedProperty,
} from "@/lib/property";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .refine((value) => value === "" || /^\+?[0-9\s.-]{8,20}$/.test(value), {
    message: "Numéro invalide",
  });

export async function switchActiveProperty(propertyId: string) {
  const session = await requireOwner();
  const owned = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: session.user.id },
  });
  if (!owned) {
    return { error: "Colocation introuvable." };
  }

  const jar = await cookies();
  jar.set(activePropertyCookieName(), owned.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function createColocation(name: string) {
  const session = await requireOwner();
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { error: "Nom invalide (2–80 caractères)." };
  }

  const property = await createPropertyForOwner(session.user.id, trimmed, 6);

  const jar = await cookies();
  jar.set(activePropertyCookieName(), property.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/admin");
  return { ok: true as const, propertyId: property.id };
}

export async function renameActiveColocation(name: string) {
  const { property } = await getActiveOwnedProperty();
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { error: "Nom invalide (2–80 caractères)." };
  }

  await prisma.property.update({
    where: { id: property.id },
    data: { name: trimmed },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updateOwnerWhatsApp(whatsappNumber: string) {
  await requireOwner();
  const parsed = phoneSchema.safeParse(whatsappNumber);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Numéro invalide" };
  }

  const { property } = await getActiveOwnedProperty();
  await prisma.property.update({
    where: { id: property.id },
    data: {
      ownerWhatsappNumber:
        parsed.data === "" ? null : parsed.data.replace(/\s/g, ""),
    },
  });

  revalidatePath("/admin/chambres");
  revalidatePath("/admin");
  return { ok: true as const };
}
