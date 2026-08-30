"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { generateQrToken } from "@/lib/security/tokens";
import { assertRoomOwnedBySession } from "@/lib/property";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .refine((value) => value === "" || /^\+?[0-9\s.-]{8,20}$/.test(value), {
    message: "Numéro invalide",
  });

const tenantNameSchema = z.string().trim().max(80);

export async function updateRoomWhatsApp(
  roomId: string,
  whatsappNumber: string,
  tenantName?: string,
) {
  await requireOwner();
  const parsedPhone = phoneSchema.safeParse(whatsappNumber);
  if (!parsedPhone.success) {
    return { error: parsedPhone.error.issues[0]?.message ?? "Numéro invalide" };
  }

  const parsedName = tenantNameSchema.safeParse(tenantName ?? "");
  if (!parsedName.success) {
    return { error: "Nom trop long (80 caractères max)" };
  }

  await assertRoomOwnedBySession(roomId);

  await prisma.room.update({
    where: { id: roomId },
    data: {
      tenantName: parsedName.data === "" ? null : parsedName.data,
      whatsappNumber:
        parsedPhone.data === "" ? null : parsedPhone.data.replace(/\s/g, ""),
    },
  });

  revalidatePath("/admin/chambres");
  revalidatePath("/admin/whatsapp");
  return { ok: true as const };
}

export async function regenerateRoomQr(roomId: string) {
  await requireOwner();
  await assertRoomOwnedBySession(roomId);
  await prisma.room.update({
    where: { id: roomId },
    data: {
      qrToken: generateQrToken(),
      qrTokenActive: true,
    },
  });
  revalidatePath("/admin/chambres");
  revalidatePath("/admin/qr");
  return { ok: true as const };
}

export async function setRoomActive(roomId: string, isActive: boolean) {
  await requireOwner();
  await assertRoomOwnedBySession(roomId);
  await prisma.room.update({
    where: { id: roomId },
    data: { isActive },
  });
  revalidatePath("/admin/chambres");
  return { ok: true as const };
}
