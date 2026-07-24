import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AssignmentStatus } from "@prisma/client";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getDefaultProperty } from "@/lib/property";
import { weekBoundsFor } from "@/lib/scheduling/schedule";
import { StatusBadge } from "@/components/StatusBadge";
import { appConfig } from "@/config/app";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Tableau de bord — ${appConfig.name}`,
};

export default async function AdminDashboardPage() {
  await requireOwner();
  const property = await getDefaultProperty();
  const { weekStart, weekEnd } = weekBoundsFor(new Date());

  const schedule = await prisma.weeklySchedule.findUnique({
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
          {property.name}
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Semaine du{" "}
          {format(weekStart, "d MMMM", { locale: fr })} au{" "}
          {format(weekEnd, "d MMMM yyyy", { locale: fr })}
        </p>
      </div>

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

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {[
          { href: "/admin/whatsapp", label: "Rappels WhatsApp" },
          { href: "/admin/qr", label: "QR codes" },
          { href: "/admin/chambres", label: "Gérer les chambres" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="touch-target flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 hover:border-teal-300 active:bg-stone-50"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
