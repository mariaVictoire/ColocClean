"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const SECONDARY_PREFIXES = ["/admin/taches", "/admin/qr", "/admin/whatsapp"];

const LINKS: {
  href: string;
  label: string;
  exact?: boolean;
  matchExtra?: string[];
  icon: ReactNode;
}[] = [
  {
    href: "/admin",
    label: "Accueil",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5 shrink-0" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10.5 12 4l8.5 6.5M6 9.5V19a1 1 0 0 0 1 1h4.5v-5h1V20H17a1 1 0 0 0 1-1V9.5" />
      </svg>
    ),
  },
  {
    href: "/admin/planning",
    label: "Planning",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5 shrink-0" aria-hidden>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path strokeLinecap="round" d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      </svg>
    ),
  },
  {
    href: "/admin/chambres",
    label: "Chambres",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5 shrink-0" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9.5A1.5 1.5 0 0 1 5.5 8H12v11M12 8h6.5A1.5 1.5 0 0 1 20 9.5V19M3 19h18M7 12h2M7 15h2" />
      </svg>
    ),
  },
  {
    href: "/admin/historique",
    label: "Histo.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5 shrink-0" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 5v4.5H9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4.5l3 1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/plus",
    label: "Plus",
    matchExtra: SECONDARY_PREFIXES,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5 shrink-0" aria-hidden>
        <circle cx="12" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t border-stone-200 bg-white pb-[max(0.5rem,var(--safe-bottom))]"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex max-w-5xl items-stretch justify-between gap-0.5 px-1 pt-1.5">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href ||
              pathname.startsWith(`${link.href}/`) ||
              (link.matchExtra?.some(
                (p) => pathname === p || pathname.startsWith(`${p}/`),
              ) ??
                false);
          return (
            <li key={link.href} className="min-w-0 flex-1">
              <Link
                href={link.href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-[0.7rem] leading-tight font-medium ${
                  active
                    ? "text-teal-800"
                    : "text-stone-500 active:bg-stone-100"
                }`}
              >
                <span className={active ? "text-teal-700" : "text-stone-400"}>
                  {link.icon}
                </span>
                <span className="max-w-full truncate">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
