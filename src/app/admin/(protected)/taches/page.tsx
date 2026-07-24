import Link from "next/link";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getDefaultProperty } from "@/lib/property";
import { appConfig } from "@/config/app";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Tâches — ${appConfig.name}`,
};

export default async function TachesPage() {
  await requireOwner();
  const property = await getDefaultProperty();
  const tasks = await prisma.task.findMany({
    where: { propertyId: property.id },
    include: { _count: { select: { checklistItems: true } } },
    orderBy: { position: "asc" },
  });

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Tâches</h1>
        <p className="mt-1 text-sm text-stone-600">
          Zones de ménage et checklists associées.
        </p>
      </div>
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {tasks.map((task) => (
          <li key={task.id}>
            <Link
              href={`/admin/taches/${task.id}`}
              className="touch-target flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-stone-50 active:bg-stone-100 sm:px-5"
            >
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{task.name}</p>
                <p className="text-sm text-stone-500">
                  Difficulté {task.difficulty ?? "—"} ·{" "}
                  {task._count.checklistItems} points
                </p>
              </div>
              <span className="text-sm text-teal-700">Voir</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
