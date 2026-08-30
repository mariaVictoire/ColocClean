import Link from "next/link";
import { requireOwner } from "@/lib/auth-helpers";
import { getActiveOwnedProperty } from "@/lib/property";
import { appConfig } from "@/config/app";
import { AdminNav } from "@/components/admin/AdminNav";
import { PropertySwitcher } from "@/components/admin/PropertySwitcher";
import { signOutAction } from "@/lib/actions/auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();
  let properties: { id: string; name: string }[] = [];
  let activePropertyId = "";
  let activeName = "";

  try {
    const { property, properties: owned } = await getActiveOwnedProperty();
    properties = owned.map((p) => ({ id: p.id, name: p.name }));
    activePropertyId = property.id;
    activeName = property.name;
  } catch {
    // Owner without property yet — pages handle empty state
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 pt-[max(0.75rem,var(--safe-top))] sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="min-w-0">
              <p className="truncate font-display text-lg font-bold tracking-tight text-teal-900 sm:text-xl">
                {appConfig.name}
              </p>
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="touch-target inline-flex items-center justify-center rounded-xl border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100"
              >
                Quitter
              </button>
            </form>
          </div>

          {properties.length > 1 ? (
            <PropertySwitcher
              properties={properties}
              activePropertyId={activePropertyId}
            />
          ) : activeName ? (
            <p className="truncate text-sm text-stone-600">{activeName}</p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-[calc(4.5rem+var(--safe-bottom))] sm:px-6 sm:py-8">
        {children}
      </div>

      <AdminNav />
    </div>
  );
}
