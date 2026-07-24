import Link from "next/link";
import { appConfig } from "@/config/app";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_50%_at_50%_-5%,_#99f6e4_0%,_transparent_55%),linear-gradient(180deg,_#f0fdfa_0%,_#fafaf9_42%,_#f5f5f4_100%)]"
      />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,var(--safe-top))] sm:px-6 sm:pb-4 sm:pt-6">
        <p className="min-w-0 truncate font-display text-base font-bold tracking-tight text-teal-900 sm:text-xl">
          {appConfig.name}
        </p>
        <Link
          href="/admin/connexion"
          className="touch-target inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-700 px-3.5 text-sm font-semibold text-white hover:bg-teal-800 active:bg-teal-900 sm:px-4"
        >
          Connexion
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:pb-20 sm:pt-8">
        <p className="font-display text-[clamp(2rem,8vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-teal-950">
          {appConfig.name}
        </p>
        <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-stone-600 sm:mt-5 sm:text-lg">
          {appConfig.description} Rotation équilibrée, QR codes permanents,
          rappels WhatsApp préparés — sans compte pour les locataires.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:max-w-md sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            href="/admin/connexion"
            className="touch-target inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 active:bg-teal-900 sm:w-auto"
          >
            <span className="sm:hidden">Tableau de bord</span>
            <span className="hidden sm:inline">Accéder au tableau de bord</span>
          </Link>
          <a
            href="#comment-ca-marche"
            className="touch-target inline-flex w-full items-center justify-center rounded-xl border border-stone-300 bg-white/70 px-5 text-sm font-semibold text-stone-700 hover:bg-white active:bg-stone-50 sm:w-auto"
          >
            Comment ça marche
          </a>
        </div>
      </section>

      <section
        id="comment-ca-marche"
        className="scroll-mt-[max(1rem,var(--safe-top))] border-t border-stone-200/80 bg-white/50 py-8 pb-[max(2rem,var(--safe-bottom))] sm:py-14"
      >
        <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 sm:grid-cols-3 sm:gap-8 sm:px-6">
          {[
            {
              title: "Planning auto",
              text: "Chaque lundi, une répartition équilibrée des 6 tâches entre les chambres.",
            },
            {
              title: "QR permanent",
              text: "Chaque chambre scanne son QR pour voir sa tâche et valider le ménage.",
            },
            {
              title: "Rappels WhatsApp",
              text: "Le propriétaire ouvre des messages déjà rédigés, sans API Business.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="border-b border-stone-200/70 pb-5 last:border-b-0 last:pb-0 sm:border-b-0 sm:pb-0"
            >
              <p className="text-xs font-semibold tracking-wide text-teal-700/80">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-1.5 font-display text-lg font-semibold text-teal-950">
                {item.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
