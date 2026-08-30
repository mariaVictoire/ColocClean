import Link from "next/link";
import { appConfig } from "@/config/app";
import { requireOwner } from "@/lib/auth-helpers";
import { signOutAction } from "@/lib/actions/auth";

export const metadata = {
  title: `Plus — ${appConfig.name}`,
};

const LINKS = [
  {
    href: "/admin/taches",
    label: "Tâches",
    description: "Checklist et détails des tâches",
  },
  {
    href: "/admin/qr",
    label: "QR codes",
    description: "Liens et QR des chambres",
  },
  {
    href: "/admin/whatsapp",
    label: "WhatsApp",
    description: "Messages et numéro du propriétaire",
  },
];

export default async function AdminPlusPage() {
  const session = await requireOwner();

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">Plus</h1>
        <p className="mt-1 text-sm text-stone-600">{session.user.email}</p>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {LINKS.map((link, index) => (
          <li
            key={link.href}
            className={index > 0 ? "border-t border-stone-100" : undefined}
          >
            <Link
              href={link.href}
              className="touch-target flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-stone-50 active:bg-stone-100 sm:px-5"
            >
              <span>
                <span className="block text-sm font-semibold text-stone-900">
                  {link.label}
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">
                  {link.description}
                </span>
              </span>
              <span className="text-stone-400" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <form action={signOutAction}>
        <button
          type="submit"
          className="touch-target inline-flex w-full items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50 active:bg-stone-100"
        >
          Quitter
        </button>
      </form>
    </main>
  );
}
