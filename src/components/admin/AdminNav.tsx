"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Accueil", exact: true },
  { href: "/admin/chambres", label: "Chambres" },
  { href: "/admin/taches", label: "Tâches" },
  { href: "/admin/planning", label: "Planning" },
  { href: "/admin/qr", label: "QR" },
  { href: "/admin/whatsapp", label: "WhatsApp" },
  { href: "/admin/historique", label: "Historique" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`touch-target inline-flex shrink-0 items-center rounded-xl px-3 text-sm font-medium transition ${
              active
                ? "bg-teal-700 text-white"
                : "text-stone-600 hover:bg-stone-100 active:bg-stone-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
