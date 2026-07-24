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
          Aucune tâche assignée pour cette semaine. Revenez plus tard ou
          contactez le propriétaire.
        </p>
      ) : assignment.status === AssignmentStatus.COMPLETED ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-900">Merci, c’est validé</p>
          <p className="mt-2 text-sm text-green-800">
            Semaine du{" "}
            {format(assignment.weeklySchedule.weekStart, "d MMMM", {
              locale: fr,
            })}{" "}
            au{" "}
            {format(assignment.weeklySchedule.weekEnd, "d MMMM yyyy", {
              locale: fr,
            })}
          </p>
          <p className="mt-1 text-sm text-green-800">
            Tâche : <strong>{assignment.task.name}</strong>
            {assignment.completedAt &&
              ` · validée le ${format(assignment.completedAt, "d MMM yyyy HH:mm", { locale: fr })}`}
          </p>
        </div>
      ) : (
        <>
          <section className="mt-5 rounded-2xl border border-teal-200 bg-white/95 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Semaine concernée
            </p>
            <p className="mt-1 text-base font-semibold text-stone-900">
              Du{" "}
              {format(assignment.weeklySchedule.weekStart, "EEEE d MMMM", {
                locale: fr,
              })}{" "}
              au{" "}
              {format(assignment.weeklySchedule.weekEnd, "EEEE d MMMM yyyy", {
                locale: fr,
              })}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              À terminer avant le{" "}
              {format(assignment.weeklySchedule.deadline, "EEEE d MMMM 'à' HH:mm", {
                locale: fr,
              })}
            </p>
          </section>

          <section className="mt-3 rounded-2xl border border-stone-200 bg-teal-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              Votre tâche cette semaine
            </p>
            <p className="mt-1 font-display text-2xl font-bold leading-tight text-teal-950">
              Vous devez nettoyer : {assignment.task.name}
            </p>
            {assignment.task.description && (
              <p className="mt-2 text-sm leading-relaxed text-teal-900/80">
                {assignment.task.description}
              </p>
            )}
            {assignment.status === AssignmentStatus.LATE && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                Cette tâche est en retard — merci de la faire et de valider dès
                que possible.
              </p>
            )}
          </section>

          <ValidateForm
            assignmentId={assignment.id}
            token={token}
            slug={slug}
            ownerWhatsappNumber={room.property.ownerWhatsappNumber}
            roomLabel={room.label}
            taskName={assignment.task.name}
            weekLabel={format(assignment.weeklySchedule.weekStart, "d MMMM", {
              locale: fr,
            })}
            items={assignment.task.checklistItems.map((item) => ({
              id: item.id,
              label: item.label,
            }))}
          />
        </>
      )}
    </main>
  );
}
