import { requireOwner } from "@/lib/auth-helpers";
import { getActiveOwnedProperty } from "@/lib/property";
import { prisma } from "@/lib/db";
import { weekBoundsFor } from "@/lib/scheduling/schedule";
import { StatusBadge } from "@/components/StatusBadge";
import { appConfig } from "@/config/app";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AssignmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Tableau de bord — ${appConfig.name}`,
};

export default async function AdminDashboardPage() {
  await requireOwner();
  const { weekStart, weekEnd } = weekBoundsFor(new Date());

  let property = null;
  let schedule = null;
  let loadError: string | null = null;

  try {
    const active = await getActiveOwnedProperty();
    property = active.property;

    schedule = await prisma.weeklySchedule.findUnique({
      where: {
        propertyId_weekStart: {
          propertyId: property.id,
          weekStart,
        },
      },
      include: {
        assignments: {
          include: {
            room: true,
            task: true,
          },
          orderBy: { room: { number: "asc" } },
        },
      },
    });
  } catch (error) {
    console.error("[admin/dashboard]", error);
    loadError =
      error instanceof Error
        ? error.message
        : "Impossible de charger les données.";
  }

  const counts = {
    total: schedule?.assignments.length ?? 0,
    completed: 0,
    pending: 0,
    late: 0,
  };
  for (const a of schedule?.assignments ?? []) {
    if (a.status === AssignmentStatus.COMPLETED) counts.completed += 1;
    else if (a.status === AssignmentStatus.LATE) counts.late += 1;
    else if (
      a.status === AssignmentStatus.PENDING ||
      a.status === AssignmentStatus.UPCOMING
    ) {
      counts.pending += 1;
    }
  }

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">
          {property?.name ?? "Tableau de bord"}
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Semaine du {format(weekStart, "d MMMM", { locale: fr })} au{" "}
          {format(weekEnd, "d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {loadError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {!loadError && !property && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aucune propriété en base. Lance le seed sur Supabase (
          <code className="text-xs">npm run db:seed</code>).
        </p>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {[
          { label: "Total", value: counts.total },
          { label: "Terminés", value: counts.completed },
          { label: "En attente", value: counts.pending },
          { label: "En retard", value: counts.late },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-stone-200 bg-white p-4"
          >
            <p className="text-xs font-medium text-stone-500">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-teal-950">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-stone-900">Planning de la semaine</h2>
          <Link
            href="/admin/planning"
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            Voir tout
          </Link>
        </div>
        {!schedule ? (
          <div className="space-y-3 p-4 sm:p-5">
            <p className="text-sm text-stone-600">
              Aucun planning pour cette semaine.
            </p>
            <Link
              href="/admin/planning"
              className="touch-target inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"
            >
              Générer le planning
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {schedule.assignments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">
                    {a.room.label}
                  </p>
                  <p className="truncate text-sm text-stone-500">{a.task.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
