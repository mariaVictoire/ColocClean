import { NextResponse } from "next/server";
import { AssignmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseRoomSlug } from "@/lib/security/tokens";
import { assertValidPhoto, getStorageAdapter } from "@/lib/storage";
import { whatsappDeepLink } from "@/lib/whatsapp/messages";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const assignmentId = String(form.get("assignmentId") ?? "");
    const token = String(form.get("token") ?? "");
    const slug = String(form.get("slug") ?? "");
    const comment = String(form.get("comment") ?? "").slice(0, 1000);
    const photo = form.get("photo");

    const number = parseRoomSlug(slug);
    if (!assignmentId || !number || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        room: { include: { property: true } },
        task: { include: { checklistItems: true } },
        weeklySchedule: true,
      },
    });

    if (
      !assignment ||
      assignment.room.number !== number ||
      assignment.room.qrToken !== token ||
      !assignment.room.qrTokenActive
    ) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    if (assignment.status === AssignmentStatus.COMPLETED) {
      return NextResponse.json({ error: "Déjà validé." }, { status: 409 });
    }

    const property = assignment.room.property;
    if (!property.ownerWhatsappNumber) {
      return NextResponse.json(
        { error: "WhatsApp du bailleur non configuré." },
        { status: 400 },
      );
    }

    if (!(photo instanceof File) || photo.size <= 0) {
      return NextResponse.json(
        { error: "Une photo est obligatoire." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    const mimeType = photo.type || "image/jpeg";
    assertValidPhoto(mimeType, buffer.byteLength);

    const storage = await getStorageAdapter();
    const uploaded = await storage.upload(buffer, {
      filename: photo.name || "photo.jpg",
      mimeType,
      folder: "validations",
    });

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.COMPLETED,
          completedAt: now,
          comment: comment || null,
          photoUrl: uploaded.url,
          clientIp: ip,
          userAgent,
        },
      });

      for (const item of assignment.task.checklistItems) {
        await tx.assignmentChecklist.upsert({
          where: {
            assignmentId_checklistItemId: {
              assignmentId: assignment.id,
              checklistItemId: item.id,
            },
          },
          create: {
            assignmentId: assignment.id,
            checklistItemId: item.id,
            isChecked: true,
            checkedAt: now,
          },
          update: {
            isChecked: true,
            checkedAt: now,
          },
        });
      }
    });

    const message = [
      `✅ ${assignment.room.label} — ${assignment.task.name} terminé.`,
      `Photo : ${uploaded.url}`,
      comment.trim() ? `Commentaire : ${comment.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappUrl = whatsappDeepLink(property.ownerWhatsappNumber, message);

    return NextResponse.json({
      ok: true,
      photoUrl: uploaded.url,
      whatsappUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
