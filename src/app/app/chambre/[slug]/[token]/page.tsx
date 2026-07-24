import { AssignmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseRoomSlug } from "@/lib/security/tokens";
import { weekBoundsFor } from "@/lib/scheduling/schedule";
import { appConfig } from "@/config/app";
import { ValidateForm } from "./ValidateForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; token: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const number = parseRoomSlug(slug);
  return {
    title: number
      ? `Chambre ${number} — ${appConfig.name}`
      : appConfig.name,
  };
}

export default async function PublicRoomPage({ params }: PageProps) {
  const { slug, token } = await params;
  const number = parseRoomSlug(slug);
  if (!number || !/^[a-f0-9]{64}$/i.test(token)) {
    notFound();
  }

  const room = await prisma.room.findFirst({
    where: {
      number,
      qrToken: token,
      qrTokenActive: true,
      isActive: true,
    },
    include: { property: true },
  });
  if (!room) notFound();

  const { weekStart } = weekBoundsFor(new Date());
  const assignment = await prisma.assignment.findFirst({
    where: {
      roomId: room.id,
      weeklySchedule: {
        propertyId: room.propertyId,
        weekStart,
        status: "ACTIVE",
      },
    },
    include: {
      task: {
        include: {
          checklistItems: { orderBy: { position: "asc" } },
        },
      },
      weeklySchedule: true,
      checklist: true,
    },
  });

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6 pt-[max(1.25rem,var(--safe-top))] pb-[max(1.5rem,var(--safe-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#ccfbf1_0%,_#fafaf9_50%,_#f5f5f4_100%)]"
      />

      <p className="font-display text-lg font-bold text-teal-900">
        {appConfig.name}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-stone-900">
        {room.label}
      </h1>

      {!assignment ? (
        <p className="mt-6 rounded-2xl border border-stone-200 bg-white/90 p-4 text-sm text-stone-600">
          Aucune tâche assignée pour cette semaine.
        </p>
      ) : assignment.status === AssignmentStatus.COMPLETED ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-900">Tâche déjà validée</p>
          <p className="mt-1 text-sm text-green-800">
            {assignment.task.name}
            {assignment.completedAt &&
              ` · ${format(assignment.completedAt, "d MMM yyyy HH:mm", { locale: fr })}`}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl border border-stone-200 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Votre tâche
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-teal-950">
              {assignment.task.name}
            </p>
            {assignment.task.description && (
              <p className="mt-2 text-sm text-stone-600">
                {assignment.task.description}
              </p>
            )}
            <p className="mt-3 text-sm text-stone-500">
              À faire avant le{" "}
              {format(assignment.weeklySchedule.deadline, "EEEE d MMMM HH:mm", {
                locale: fr,
              })}
            </p>
            {assignment.status === AssignmentStatus.LATE && (
              <p className="mt-2 text-sm font-medium text-red-700">
                Cette tâche est en retard.
              </p>
            )}
          </div>

          <ValidateForm
            assignmentId={assignment.id}
            token={token}
            slug={slug}
            photoRequired={room.property.photoRequired}
            items={assignment.task.checklistItems.map((item) => ({
              id: item.id,
              label: item.label,
              isRequired: item.isRequired,
              isChecked:
                assignment.checklist.find((c) => c.checklistItemId === item.id)
                  ?.isChecked ?? false,
            }))}
          />
        </>
      )}
    </main>
  );
}
