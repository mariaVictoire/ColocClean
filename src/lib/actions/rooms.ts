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

export async function updateRoomWhatsApp(
  roomId: string,
  whatsappNumber: string,
) {
  await requireOwner();
  const parsed = phoneSchema.safeParse(whatsappNumber);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Numéro invalide" };
  }

  await assertRoomOwnedBySession(roomId);

  await prisma.room.update({
    where: { id: roomId },
    data: {
      whatsappNumber:
        parsed.data === "" ? null : parsed.data.replace(/\s/g, ""),
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
