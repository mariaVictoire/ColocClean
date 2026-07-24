import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getDefaultProperty } from "@/lib/property";
import { REMINDER_TYPE_LABELS } from "@/lib/constants/reminders";
import { StatusBadge } from "@/components/StatusBadge";
import { appConfig } from "@/config/app";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Historique — ${appConfig.name}`,
};

export default async function HistoriquePage() {
  await requireOwner();
  const property = await getDefaultProperty();

  const [assignments, reminders] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        weeklySchedule: { propertyId: property.id },
        status: { in: ["COMPLETED", "LATE", "EXCUSED"] },
      },
      include: {
        room: true,
        task: true,
        weeklySchedule: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.reminderLog.findMany({
      where: {
        assignment: { weeklySchedule: { propertyId: property.id } },
      },
      include: {
        assignment: {
          include: { room: true, task: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Historique</h1>
        <p className="mt-1 text-sm text-stone-600">
          Validations et rappels récents.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-stone-900">Validations</h2>
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {assignments.length === 0 ? (
            <li className="px-4 py-5 text-sm text-stone-500">Aucun événement.</li>
          ) : (
            assignments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">
                    {a.room.label} · {a.task.name}
                  </p>
                  <p className="text-xs text-stone-500">
                    {format(a.updatedAt, "d MMM yyyy HH:mm", { locale: fr })}
                    {a.completedAt &&
                      ` · validé ${format(a.completedAt, "d MMM HH:mm", { locale: fr })}`}
                  </p>
                  {a.photoUrl && (
                    <a
                      href={a.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.photoUrl}
                        alt={`Preuve ${a.room.label}`}
                        className="h-20 w-28 rounded-lg object-cover"
                      />
                    </a>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-stone-900">Rappels WhatsApp</h2>
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {reminders.length === 0 ? (
            <li className="px-4 py-5 text-sm text-stone-500">Aucun rappel.</li>
          ) : (
            reminders.map((r) => (
              <li key={r.id} className="px-4 py-3 sm:px-5">
                <p className="font-medium text-stone-900">
                  {r.assignment.room.label} · {REMINDER_TYPE_LABELS[r.type]}
                </p>
                <p className="text-xs text-stone-500">
                  Préparé{" "}
                  {format(r.createdAt, "d MMM yyyy HH:mm", { locale: fr })}
                  {r.markedAsSentAt
                    ? ` · envoyé ${format(r.markedAsSentAt, "d MMM HH:mm", { locale: fr })}`
                    : " · non marqué envoyé"}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
