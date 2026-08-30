import { requireOwner } from "@/lib/auth-helpers";
import { getActiveOwnedProperty } from "@/lib/property";
import { AdminNav } from "@/components/admin/AdminNav";
import { PropertySwitcher } from "@/components/admin/PropertySwitcher";

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
          {properties.length > 1 ? (
            <PropertySwitcher
              properties={properties}
              activePropertyId={activePropertyId}
            />
          ) : (
            <p className="truncate font-display text-lg font-bold tracking-tight text-teal-950">
              {activeName || "ColocClean"}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-[calc(4.5rem+var(--safe-bottom))] sm:px-6 sm:py-8">
        {children}
      </div>

      <AdminNav />
    </div>
  );
}
