"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getDefaultProperty } from "@/lib/property";
import { z } from "zod";

const phoneSchema = z.string().trim().max(20).refine(
  (value) => value === "" || /^\+?[0-9\s.-]{8,20}$/.test(value),
  { message: "Numéro invalide" },
);

export async function updateOwnerWhatsApp(whatsappNumber: string) {
  await requireOwner();
  const parsed = phoneSchema.safeParse(whatsappNumber);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Numéro invalide" };
  }

  const property = await getDefaultProperty();
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
