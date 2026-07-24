import { requireOwner } from "@/lib/auth-helpers";
import { signOut } from "@/lib/auth";
import { appConfig } from "@/config/app";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOwner();

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 pt-[max(0.75rem,var(--safe-top))] sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold text-teal-900 sm:text-xl">
                {appConfig.name}
              </p>
              <p className="truncate text-xs text-stone-500 sm:text-sm">
                {session.user.email}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/connexion" });
              }}
            >
              <button
                type="submit"
                className="touch-target inline-flex items-center justify-center rounded-xl border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100"
              >
                Quitter
              </button>
            </form>
          </div>
          <AdminNav />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-[max(1.25rem,var(--safe-bottom))] sm:px-6 sm:py-8">
        {children}
      </div>
    </div>
  );
}
