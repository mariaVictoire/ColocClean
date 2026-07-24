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
    const checkedRaw = String(form.get("checkedIds") ?? "[]");
    const photo = form.get("photo");

    const number = parseRoomSlug(slug);
    if (!assignmentId || !number || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    let checkedIds: string[] = [];
    try {
      checkedIds = JSON.parse(checkedRaw) as string[];
      if (!Array.isArray(checkedIds)) throw new Error("bad");
    } catch {
      return NextResponse.json({ error: "Checklist invalide." }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        room: true,
        task: { include: { checklistItems: true } },
        weeklySchedule: true,
        checklist: true,
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

    const required = assignment.task.checklistItems.filter((i) => i.isRequired);
    const checkedSet = new Set(checkedIds);
    if (!required.every((i) => checkedSet.has(i.id))) {
      return NextResponse.json(
        { error: "Cochez tous les points obligatoires." },
        { status: 400 },
      );
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

    await prisma.$transaction(async (tx) => {
      await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.COMPLETED,
          completedAt: new Date(),
          comment: comment || null,
          photoUrl,
          clientIp: ip,
          userAgent,
        },
      });

      for (const item of assignment.task.checklistItems) {
        const isChecked = checkedSet.has(item.id);
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
            isChecked,
            checkedAt: isChecked ? new Date() : null,
          },
          update: {
            isChecked,
            checkedAt: isChecked ? new Date() : null,
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
