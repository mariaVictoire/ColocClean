import { NextResponse } from "next/server";
import { AssignmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseRoomSlug } from "@/lib/security/tokens";
import { assertValidPhoto, getStorageAdapter } from "@/lib/storage";

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
        room: true,
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

    let photoUrl: string | null = null;
    const property = await prisma.property.findUniqueOrThrow({
      where: { id: assignment.room.propertyId },
    });

    if (photo instanceof File && photo.size > 0) {
      const buffer = Buffer.from(await photo.arrayBuffer());
      assertValidPhoto(photo.type || "image/jpeg", buffer.byteLength);
      const storage = await getStorageAdapter();
      const uploaded = await storage.upload(buffer, {
        filename: photo.name || "photo.jpg",
        mimeType: photo.type || "image/jpeg",
        folder: "validations",
      });
      photoUrl = uploaded.url;
    } else if (property.photoRequired) {
      return NextResponse.json(
        { error: "Une photo est obligatoire." },
        { status: 400 },
      );
    }

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
          photoUrl,
          clientIp: ip,
          userAgent,
        },
      });

      // Marque la checklist comme faite (rappel uniquement côté UI)
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
