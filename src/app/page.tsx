import Link from "next/link";
import { appConfig } from "@/config/app";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 pt-[max(1rem,var(--safe-top))] pb-[max(1.5rem,var(--safe-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,_#99f6e4_0%,_transparent_55%),linear-gradient(180deg,_#f0fdfa_0%,_#fafaf9_45%,_#f5f5f4_100%)]"
      />

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="font-display text-[clamp(2.5rem,10vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-teal-950">
          {appConfig.name}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg">
          {appConfig.description}
        </p>
        <Link
          href="/admin/connexion"
          className="touch-target mt-8 inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 active:bg-teal-900"
        >
          Connexion
        </Link>
      </div>
    </main>
  );
}
