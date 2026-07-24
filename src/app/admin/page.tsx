import Link from "next/link";
import { requireOwner } from "@/lib/auth-helpers";
import { appConfig } from "@/config/app";
import { signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Tableau de bord — ${appConfig.name}`,
};

export default async function AdminDashboardPage() {
  const session = await requireOwner();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-6 pt-[max(1.25rem,var(--safe-top))] pb-[max(1.5rem,var(--safe-bottom))] sm:gap-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="font-display text-xl font-bold text-teal-900 sm:text-2xl">
            {appConfig.name}
          </p>
          <p className="mt-0.5 truncate text-sm text-stone-600">
            {session.user.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/connexion" });
          }}
          className="w-full sm:w-auto"
        >
          <button
            type="submit"
            className="touch-target inline-flex w-full items-center justify-center rounded-xl border border-stone-300 px-3.5 text-sm font-medium text-stone-700 hover:bg-stone-50 sm:w-auto"
          >
            Déconnexion
          </button>
        </form>
      </header>

      <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:p-6">
        <h1 className="text-lg font-semibold text-teal-950 sm:text-xl">
          Phase 1 prête
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-teal-900/80">
          Authentification, base de données et seed sont opérationnels. Les
          écrans planning, chambres, QR codes et WhatsApp arriveront aux
          phases suivantes.
        </p>
      </section>

      <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/admin", label: "Tableau de bord", note: "Phase 2" },
          { href: "/admin", label: "Chambres", note: "Phase 2" },
          { href: "/admin", label: "Tâches", note: "Phase 2" },
          { href: "/admin", label: "Planning", note: "Phase 3" },
          { href: "/admin", label: "QR codes", note: "Phase 4" },
          { href: "/admin", label: "Rappels WhatsApp", note: "Phase 5" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="touch-target flex flex-col justify-center rounded-2xl border border-stone-200 bg-white p-4 transition active:bg-stone-50 hover:border-teal-300 hover:shadow-sm"
          >
            <p className="font-medium text-stone-900">{item.label}</p>
            <p className="mt-1 text-xs text-stone-500">{item.note}</p>
          </Link>
        ))}
      </nav>
    </main>
  );
}
