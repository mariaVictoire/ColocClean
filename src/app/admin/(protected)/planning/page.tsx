import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getActiveOwnedProperty } from "@/lib/property";
import { weekBoundsFor } from "@/lib/scheduling/schedule";
import { StatusBadge } from "@/components/StatusBadge";
import { appConfig } from "@/config/app";
import { ExcuseButton, PlanningActions } from "./PlanningActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Planning — ${appConfig.name}`,
};

export default async function PlanningPage() {
  await requireOwner();
  const { property } = await getActiveOwnedProperty();
  const { weekStart, weekEnd } = weekBoundsFor(new Date());

  const schedule = await prisma.weeklySchedule.findUnique({
    where: {
      propertyId_weekStart: { propertyId: property.id, weekStart },
    },
    include: {
      assignments: {
        include: { room: true, task: true },
        orderBy: { room: { number: "asc" } },
      },
    },
  });

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Planning</h1>
        <p className="mt-1 text-sm text-stone-600">
          Semaine du {format(weekStart, "d MMMM", { locale: fr })} au{" "}
          {format(weekEnd, "d MMMM yyyy", { locale: fr })}
          {schedule && (
            <>
              {" "}
              · échéance{" "}
              {format(schedule.deadline, "EEEE d MMM HH:mm", { locale: fr })}
            </>
          )}
          {property.cycleAnchorWeekStart &&
            property.rotationMode === "PAPER" && (
            <>
              {" "}
              · cycle papier depuis le{" "}
              {format(property.cycleAnchorWeekStart, "d MMM yyyy", {
                locale: fr,
              })}
            </>
          )}
          {property.rotationMode === "BALANCED" && (
            <> · 1 tâche par chambre</>
          )}
        </p>
      </div>

      <PlanningActions hasSchedule={!!schedule} />

      {!schedule ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
          Aucun planning actif. Générez la rotation de la semaine.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {schedule.assignments.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
            >
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{a.room.label}</p>
                <p className="text-sm text-stone-500">{a.task.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                {a.status !== "EXCUSED" && a.status !== "COMPLETED" && (
                  <ExcuseButton assignmentId={a.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
