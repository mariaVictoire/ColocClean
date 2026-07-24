import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { appConfig } from "@/config/app";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  return {
    title: task ? `${task.name} — ${appConfig.name}` : `Tâche — ${appConfig.name}`,
  };
}

export default async function TacheDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      checklistItems: { orderBy: { position: "asc" } },
    },
  });
  if (!task) notFound();

  return (
    <main className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin/taches"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          ← Tâches
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">{task.name}</h1>
        {task.description && (
          <p className="mt-1 text-sm text-stone-600">{task.description}</p>
        )}
        <p className="mt-2 text-sm text-stone-500">
          Difficulté {task.difficulty ?? "—"} / 5
        </p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white">
        <h2 className="border-b border-stone-100 px-4 py-3 font-semibold text-stone-900 sm:px-5">
          Checklist
        </h2>
        <ol className="divide-y divide-stone-100">
          {task.checklistItems.map((item, index) => (
            <li
              key={item.id}
              className="flex items-start gap-3 px-4 py-3 text-sm text-stone-800 sm:px-5"
            >
              <span className="mt-0.5 w-6 shrink-0 text-xs font-semibold text-teal-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
